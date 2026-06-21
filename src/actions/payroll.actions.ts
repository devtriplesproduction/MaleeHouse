"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getAttendanceLogsAction } from "./attendance.actions";
import { getAllUsersAction, logAdminAuditAction } from "./admin.actions";
import { randomUUID } from "crypto";

export interface PayrollCycle {
  id: string;
  month: number;
  year: number;
  status: "draft" | "locked";
  locked_by?: string;
  locked_at?: string;
}

export interface PayrollSnapshot {
  id: string;
  cycle_id: string;
  employee_id: string;
  employee_name: string;
  employee_id_external: string;
  department: string;
  designation: string;
  base_salary: number;
  days_present: number;
  days_field: number;
  days_paid_leave: number;
  days_unpaid_leave: number;
  days_absent: number;
  net_payable: number;
  calculated_at: string;
}

/**
 * getPayrollCyclesAction
 * Returns list of payroll cycles.
 */
export async function getPayrollCyclesAction() {
  try {
    const supabase: any = await createClient();
    const { data: cycles, error } = await supabase.from('payroll_cycles').select('*');
    if (error) throw error;
    return { success: true, data: cycles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * calculateMonthlyPayrollAction
 * Computes live draft payroll based on attendance records and current salary parameters.
 */
export async function calculateMonthlyPayrollAction(month: number, year: number) {
  try {
    const supabase: any = await createClient();

    // 1. Fetch all active employees
    const empRes = await getAllUsersAction();
    if (!empRes.success || !empRes.data) {
      return { success: false, error: "Failed to fetch employees." };
    }

    const employees = empRes.data.filter((u: any) => u.status !== "terminated" && u.status !== "archived");

    // 2. Fetch all attendance logs for this month/year
    const attRes = await getAttendanceLogsAction(undefined, month, year);
    const attendanceLogs = attRes.success && attRes.data ? attRes.data : [];

    // Check if cycle is already locked
    const { data: cycles, error: cyclesError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (cyclesError) throw cyclesError;

    const existing = cycles && cycles.length > 0 ? cycles[0] : null;
    const isLocked = existing?.status === "locked";

    if (isLocked) {
      // Return immutable snapshots!
      const { data: cycleSnapshots, error: snapshotsError } = await supabase
        .from('payroll_snapshots')
        .select('*')
        .eq('cycle_id', existing.id);

      if (snapshotsError) throw snapshotsError;

      return { success: true, data: cycleSnapshots, isLocked: true };
    }

    // Days in Month (approx working days = 22)
    const workingDaysLimit = 22;

    const draftSnapshots: PayrollSnapshot[] = employees.map((emp: any) => {
      const empLogs = attendanceLogs.filter((l: any) => l.employee_id === emp.id);

      const days_present = empLogs.filter((l: any) => l.status === "present").length;
      const days_field = empLogs.filter((l: any) => l.status === "field_assignment").length;
      const days_paid_leave = empLogs.filter((l: any) => l.status === "paid_leave").length;
      const days_unpaid_leave = empLogs.filter((l: any) => l.status === "unpaid_leave").length;
      const days_absent = empLogs.filter((l: any) => l.status === "absent").length;

      const base_salary = emp.salary || 3000;
      
      // Calculate net payable (basic prorated salary deductions for unpaid leave & absent days)
      const totalEarnedDays = Math.min(workingDaysLimit, (days_present + days_field + days_paid_leave));
      const penaltyDays = days_unpaid_leave + days_absent;
      
      const prorationFactor = workingDaysLimit > 0 ? (workingDaysLimit - penaltyDays) / workingDaysLimit : 1;
      const net_payable = Math.max(0, Math.round(base_salary * Math.max(0, prorationFactor)));

      return {
        id: `draft-${emp.id}`,
        cycle_id: existing?.id || "draft-cycle",
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_id_external: emp.employee_id || "MH-UNK-000",
        department: emp.department || "survey",
        designation: emp.designation || "staff",
        base_salary,
        days_present,
        days_field,
        days_paid_leave,
        days_unpaid_leave,
        days_absent,
        net_payable,
        calculated_at: new Date().toISOString()
      };
    });

    return { success: true, data: draftSnapshots, isLocked: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * lockPayrollCycleAction
 * Freezes the draft calculation and logs it as an immutable snapshot.
 */
export async function lockPayrollCycleAction(month: number, year: number) {
  const profile: any = await getUserProfileAction();
  if (profile?.role !== "admin") {
    return { success: false, error: "Only System Administrators can lock payroll cycles." };
  }

  try {
    const supabase: any = await createClient();

    const { data: cycles, error: cycleFetchError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (cycleFetchError) throw cycleFetchError;

    const existing = cycles && cycles.length > 0 ? cycles[0] : null;

    if (existing && existing.status === "locked") {
      return { success: false, error: "This payroll cycle is already locked and immutable." };
    }

    const cycleId = existing?.id || randomUUID();
    
    // Upsert the cycle
    const { error: upsertError } = await supabase
      .from('payroll_cycles')
      .upsert({
        id: cycleId,
        month,
        year,
        status: "locked",
        locked_by: profile.id,
        locked_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // 2. Fetch the draft computations to freeze them
    const draftRes = await calculateMonthlyPayrollAction(month, year);
    if (!draftRes.success || !draftRes.data) {
      return { success: false, error: "Failed to generate payroll calculation for freeze." };
    }

    const frozenSnapshots: PayrollSnapshot[] = draftRes.data.map((draft: any) => ({
      ...draft,
      id: randomUUID(),
      cycle_id: cycleId,
      calculated_at: new Date().toISOString()
    }));

    // 3. Write snapshot
    const { error: snapshotsInsertError } = await supabase
      .from('payroll_snapshots')
      .insert(frozenSnapshots);

    if (snapshotsInsertError) throw snapshotsInsertError;

    // 4. Admin Audit Logging
    await logAdminAuditAction({
      action: "PAYROLL_CYCLE_LOCKED",
      details: { month, year, snapshot_count: frozenSnapshots.length },
      severity: "critical"
    });

    revalidatePath("/admin/payroll");
    return { success: true, message: `Payroll cycle for ${month}/${year} locked successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
