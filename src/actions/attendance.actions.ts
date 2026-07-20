"use server";

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from "next/cache";
import { getUserProfileAction } from "@/actions/auth.actions";
import { createClient } from "@/lib/supabase/server";
import { logAdminAuditAction } from "./admin.actions";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "paid_leave"
  | "unpaid_leave"
  | "holiday"
  | "half_day"
  | "field_assignment"
  | "weekend";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  signal_type: "eod_submission" | "admin_override" | "holiday_calendar" | "weekend_auto";
  finalized: boolean;
  notes?: string;
  locked_payroll_cycle_id?: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * isPayrollCycleLocked
 * Internal check to verify if a payroll cycle is frozen.
 */
export async function isPayrollCycleLocked(dateStr: string): Promise<{ locked: boolean; cycleId?: string }> {
  try {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const supabase: any = await createClient();
    const { data: matched, error } = await supabase
      .from('payroll_cycles')
      .select('id, status')
      .eq('month', month)
      .eq('year', year)
      .eq('status', 'locked')
      .maybeSingle();

    if (matched) {
      return { locked: true, cycleId: matched.id };
    }
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

/**
 * registerAttendanceSignalAction
 * Automatically registers an EOD submission or clock signal as attendance.
 */
export async function registerAttendanceSignalAction(
  employeeId: string,
  dateStr: string,
  status: AttendanceStatus,
  signalType: AttendanceRecord["signal_type"],
  notes?: string
) {
  try {
    // 1. Check Payroll Lock
    const lockCheck = await isPayrollCycleLocked(dateStr);
    if (lockCheck.locked) {
      return { success: false, error: "Mutation failed. The payroll cycle for this month is historically locked." };
    }

    const supabaseAdmin: any = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    
    // Check if a record already exists
    const { data: existing } = await supabaseAdmin
      .from('attendance_logs')
      .select('id, signal_type, notes')
      .eq('employee_id', employeeId)
      .eq('date', dateStr)
      .maybeSingle();

    if (existing) {
      if (existing.signal_type === "admin_override" && signalType !== "admin_override") {
        return { success: true, message: "Administrative override preserved." };
      }

      const { error } = await supabaseAdmin
        .from('attendance_logs')
        .update({
          status,
          signal_type: signalType,
          notes: notes || existing.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
        
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from('attendance_logs')
        .insert({
          employee_id: employeeId,
          date: dateStr,
          status,
          signal_type: signalType,
          finalized: false,
          notes,
          locked_payroll_cycle_id: null
        });
        
      if (error) throw new Error(error.message);
    }

    revalidatePath("/eod");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * overrideAttendanceAction
 * Enforces HR Admin level overrides with full audit logging.
 */
export async function overrideAttendanceAction(
  employeeId: string,
  dateStr: string,
  status: AttendanceStatus,
  reason: string
) {
  const profile: any = await getUserProfileAction();
  if (profile?.role !== "admin" && profile?.role !== "hr") {
    return { success: false, error: "Elevated administrative privileges required." };
  }

  try {
    const res = await registerAttendanceSignalAction(employeeId, dateStr, status, "admin_override", reason);
    
    if (res.success) {
      // Log Audit
      await logAdminAuditAction({
        action: "ATTENDANCE_OVERRIDE",
        details: { employee_id: employeeId, date: dateStr, override_status: status, reason },
        severity: "warning",
        targetUserId: employeeId
      });
    }

    return res;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * getAttendanceLogsAction
 * Retrieves records for employees.
 */
export async function getAttendanceLogsAction(employeeId?: string, month?: number, year?: number) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabaseAdmin: any = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    let query = supabaseAdmin.from('attendance_logs').select('*');

    const isPrivileged = profile.role === 'admin' || profile.role === 'hr' || profile.role === 'accountant';

    if (!isPrivileged) {
      // Normal users can only see their own attendance logs
      query = query.eq('employee_id', profile.id);
    } else if (employeeId) {
      // HR/Admin can query a specific employee
      query = query.eq('employee_id', employeeId);
    }

    const { data: attendance, error } = await query;
    if (error) throw new Error(error.message);

    let filtered = attendance || [];

    if (month && year) {
      filtered = filtered.filter((a: any) => {
        const d = new Date(a.date);
        return (d.getMonth() + 1) === month && d.getFullYear() === year;
      });
    }

    return { success: true, data: normalizeData(filtered) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
