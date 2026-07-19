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

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();

    // Check if cycle is already locked
    const { data: cycles, error: cyclesError } = await supabaseAdmin
      .from('payroll_cycles')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (cyclesError) throw cyclesError;

    // 3. Fetch EOD reports for this month
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data: eodLogs, error: eodError } = await supabaseAdmin
      .from('eod_reports')
      .select('user_id, date')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
      
    if (eodError) throw eodError;

    // Fetch holidays for this month
    const { data: holidays, error: holidayError } = await supabase
      .from('holidays')
      .select('date, is_optional')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
      
    if (holidayError) throw holidayError;
    const standardHolidaysCount = holidays ? holidays.length : 0;

    const existing: any = cycles && cycles.length > 0 ? cycles[0] : null;
    const isLocked = existing?.status === "locked";

    if (isLocked) {
      // Return immutable snapshots!
      const { data: cycleSnapshots, error: snapshotsError } = await supabaseAdmin
        .from('payroll_snapshots')
        .select('*')
        .eq('cycle_id', existing.id);

      if (snapshotsError) throw snapshotsError;

      return { success: true, data: cycleSnapshots, isLocked: true };
    }

    // Fetch all salary increments up to this month
    const { data: incrementsData } = await supabase
      .from('salary_increments')
      .select('*')
      .lte('effective_date', endOfMonth)
      .order('effective_date', { ascending: false });

    // Days in Month (fixed working days = 26)
    const workingDaysLimit = 26;

    const draftSnapshots: PayrollSnapshot[] = employees.map((emp: any) => {
      const empLogs = attendanceLogs.filter((l: any) => l.employee_id === emp.id);
      
      const leave_dates = empLogs.filter((l: any) => l.status === "paid_leave" || l.status === "unpaid_leave").map((l: any) => l.date);

      // Calculate leave and field days from attendance logs (approved leaves/fields)
      const days_field = 0; // Field days are now counted implicitly through EOD submissions
      const days_paid_leave = empLogs.filter((l: any) => l.status === "paid_leave").length;
      const days_unpaid_leave = empLogs.filter((l: any) => l.status === "unpaid_leave").length;
      
      // Calculate days_present based on EOD submissions (deduplicate against leave logs)
      const filteredEods = eodLogs ? eodLogs.filter((e: any) => e.user_id === emp.id && !leave_dates.includes(e.date)) : [];
      const days_present = filteredEods.length;
      if (emp.first_name === 'Yash') console.log('Yash eods:', filteredEods, eodLogs ? eodLogs.filter((e:any) => e.user_id === emp.id) : []);
      
      // Calculate days_absent: Any working day (up to 26) not accounted for by EODs, Leaves, or Holidays
      const accounted_days = days_present + days_field + days_paid_leave + days_unpaid_leave + standardHolidaysCount;
      const days_absent = Math.max(0, workingDaysLimit - accounted_days);

      // Find latest applicable increment
      const empIncrements = (incrementsData || []).filter((inc: any) => inc.employee_id === emp.id);
      const latestIncrement = empIncrements.length > 0 ? empIncrements[0] : null;

      const base_salary = latestIncrement ? latestIncrement.new_salary : (emp.salary || 3000);
      
      // Calculate net payable (basic prorated salary deductions for unpaid leave & absent days)
      const totalEarnedDays = Math.min(workingDaysLimit, (days_present + days_field + days_paid_leave + standardHolidaysCount));
      const penaltyDays = days_unpaid_leave + days_absent;
      
      const prorationFactor = workingDaysLimit > 0 ? totalEarnedDays / workingDaysLimit : 1;
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
export async function lockPayrollCycleAction(month: number, year: number, bankId?: string) {
  const profile: any = await getUserProfileAction();
  if (profile?.role !== "admin" && profile?.role !== "hr") {
    return { success: false, error: "Only System Administrators or HR can lock payroll cycles." };
  }

  try {
    const supabase: any = await createClient();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

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
    
    // 1. Fetch the draft computations to freeze them (must happen BEFORE upserting lock)
    const draftRes = await calculateMonthlyPayrollAction(month, year);
    if (!draftRes.success || !draftRes.data) {
      return { success: false, error: "Failed to generate payroll calculation for freeze." };
    }

    // Upsert the cycle
    const { error: upsertError } = await supabaseAdmin
      .from('payroll_cycles')
      .upsert({
        id: cycleId,
        month,
        year,
        status: "locked",
        locked_by: profile.id,
        locked_at: new Date().toISOString(),
        bank_id: bankId || null,
      }, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    const frozenSnapshots: PayrollSnapshot[] = draftRes.data.map((draft: any) => ({
      ...draft,
      id: randomUUID(),
      cycle_id: cycleId,
      calculated_at: new Date().toISOString()
    }));

    // 3. Write snapshot
    const { error: snapshotsInsertError } = await supabaseAdmin
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
    revalidatePath("/hr/payroll");

    if (bankId) {
      const { syncBankBalance } = await import("@/actions/bank.actions");
      await syncBankBalance(bankId);
      const { flagBackdatedReconciliationsAction } = await import("@/actions/reconciliation.actions");
      const transactionDate = new Date(year, month, 0).toISOString().split('T')[0];
      await flagBackdatedReconciliationsAction(bankId, transactionDate, "Payroll Cycle Locked");
    }

    return { success: true, message: `Payroll cycle for ${month}/${year} locked successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * unlockPayrollCycleAction
 * Removes the frozen snapshot and reverts the payroll cycle back to draft mode.
 */
export async function unlockPayrollCycleAction(month: number, year: number) {
  const profile: any = await getUserProfileAction();
  if (profile?.role !== "admin" && profile?.role !== "hr") {
    return { success: false, error: "Only System Administrators or HR can unlock payroll cycles." };
  }

  try {
    const supabase: any = await createClient();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data: cycles, error: cycleFetchError } = await supabaseAdmin
      .from('payroll_cycles')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (cycleFetchError) throw cycleFetchError;

    const existing = cycles && cycles.length > 0 ? cycles[0] : null;

    if (!existing || existing.status !== "locked") {
      return { success: false, error: "This payroll cycle is not locked." };
    }

    // 1. Delete snapshots
    const { error: snapshotsDeleteError } = await supabaseAdmin
      .from('payroll_snapshots')
      .delete()
      .eq('cycle_id', existing.id);

    if (snapshotsDeleteError) throw snapshotsDeleteError;

    // 2. Delete the cycle record (this returns it to draft implicitly)
    const { error: cycleDeleteError } = await supabaseAdmin
      .from('payroll_cycles')
      .delete()
      .eq('id', existing.id);

    if (cycleDeleteError) throw cycleDeleteError;

    // 3. Admin Audit Logging
    await logAdminAuditAction({
      action: "PAYROLL_CYCLE_UNLOCKED",
      details: { month, year },
      severity: "critical"
    });

    revalidatePath("/admin/payroll");
    revalidatePath("/hr/payroll");

    if (existing.bank_id) {
      const { syncBankBalance } = await import("@/actions/bank.actions");
      await syncBankBalance(existing.bank_id);
      const { flagBackdatedReconciliationsAction } = await import("@/actions/reconciliation.actions");
      const transactionDate = new Date(year, month, 0).toISOString().split('T')[0];
      await flagBackdatedReconciliationsAction(existing.bank_id, transactionDate, "Payroll Cycle Unlocked");
    }

    return { success: true, message: `Payroll cycle for ${month}/${year} unlocked successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
