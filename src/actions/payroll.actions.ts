"use server";

import { normalizeData } from '@/lib/normalize';
import { headers } from "next/headers";

import { revalidatePath } from "next/cache";
import { createElement } from 'react';

import { createClient } from "@/lib/supabase/server";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getAttendanceLogsAction } from "./attendance.actions";
import { getAllUsersAction, logAdminAuditAction } from "./admin.actions";
import { sendLocalNotifications } from "./operations.actions";
import { randomUUID } from "crypto";

async function logPayrollEvent(
  action: string, 
  targetUserId: string | null | undefined, 
  details: any,
  severity: 'info' | 'warning' | 'critical' | 'security' = 'info'
) {
  let ip = null;
  let userAgent = null;
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    userAgent = headersList.get('user-agent') || null;
  } catch(e) {
    // ignore if outside request context
  }

  await logAdminAuditAction({
    action,
    targetUserId: targetUserId ?? undefined,
    severity,
    details: {
      ...details,
      ip_address: ip,
      user_agent: userAgent
    }
  });
}


function getStoragePathFromUrl(pdfUrl: string): string {
  try {
    const urlObj = new URL(pdfUrl);
    const bucketStr = '/salary_slips/';
    const bucketIndex = urlObj.pathname.indexOf(bucketStr);
    if (bucketIndex !== -1) {
      return decodeURIComponent(urlObj.pathname.substring(bucketIndex + bucketStr.length));
    }
  } catch (e) {
    // ignore
  }
  const parts = pdfUrl.split('?')[0].split('/');
  return decodeURIComponent(parts[parts.length - 1]);
}

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
  basic_salary?: number;
  hra?: number;
  allowance?: number;
  bonus?: number;
  gross_salary?: number;
  pf?: number;
  esi?: number;
  professional_tax?: number;
  income_tax?: number;
  other_deductions?: number;
  total_deductions?: number;
  net_salary?: number;
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
    return { success: true, data: normalizeData(cycles) };
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
      // Return immutable snapshots along with salary slip tracking fields
      const { data: cycleSnapshots, error: snapshotsError } = await supabaseAdmin
        .from('payroll_snapshots')
        .select('*, salary_slips(in_app_notified_at, emailed, notification_status)')
        .eq('cycle_id', existing.id);

      if (snapshotsError) throw snapshotsError;

      // Flatten salary slip data into snapshot for the UI
      const enrichedSnapshots = cycleSnapshots.map((snap: any) => {
        const slip = snap.salary_slips && snap.salary_slips.length > 0 ? snap.salary_slips[0] : null;
        return {
          ...snap,
          in_app_notified_at: slip ? slip.in_app_notified_at : null,
          emailed: slip ? slip.emailed : false,
          notification_status: slip?.notification_status || 'Pending'
        };
      });

      return { success: true, data: enrichedSnapshots, isLocked: true };
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

      const basic_salary = Math.round(net_payable * 0.5);
      const hra = Math.round(net_payable * 0.2);
      const allowance = net_payable - basic_salary - hra;
      const bonus = 0;
      const gross_salary = basic_salary + hra + allowance + bonus;
      
      const pf = 0;
      const esi = 0;
      const professional_tax = 0;
      const income_tax = 0;
      const other_deductions = 0;
      const total_deductions = pf + esi + professional_tax + income_tax + other_deductions;
      
      const net_salary = gross_salary - total_deductions;

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
        basic_salary,
        hra,
        allowance,
        bonus,
        gross_salary,
        pf,
        esi,
        professional_tax,
        income_tax,
        other_deductions,
        total_deductions,
        net_salary,
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

    const { data: cycles, error: cycleFetchError } = await supabaseAdmin
      .from('payroll_cycles')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (cycleFetchError) throw cycleFetchError;

    const existing = cycles && cycles.length > 0 ? cycles[0] : null;

    if (existing) {
      if (existing.status === "locked") {
        return { success: false, error: "This payroll cycle is already locked and immutable." };
      }
      if (existing.status === "processing") {
        return { success: false, error: "Payroll is already being processed." };
      }
    }

    const cycleId = existing?.id || randomUUID();
    const wasDraft = existing ? true : false;
    let cycleLocked = false;
    const uploadedFileNames: string[] = [];
    
    try {
      // 0. ATOMIC LOCK ACQUISITION
      if (wasDraft) {
        // Atomically update from draft to processing to acquire lock
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('payroll_cycles')
          .update({ status: 'processing', locked_by: profile.id, locked_at: new Date().toISOString() })
          .eq('id', cycleId)
          .eq('status', 'draft')
          .select();
          
        if (updateError || !updateData || updateData.length === 0) {
          return { success: false, error: "Payroll is already being processed." };
        }
      } else {
        // Atomically insert as processing (fails if month/year exists due to unique constraint)
        const { error: insertError } = await supabaseAdmin
          .from('payroll_cycles')
          .insert({
            id: cycleId,
            month,
            year,
            status: 'processing',
            locked_by: profile.id,
            locked_at: new Date().toISOString(),
            bank_id: bankId || null,
          });
          
        if (insertError) {
          return { success: false, error: "Payroll is already being processed." };
        }
      }

      cycleLocked = true; // Mark lock acquired for rollback purposes

      // 1. Fetch the draft computations to freeze them (happens AFTER securing the lock)
      const draftRes = await calculateMonthlyPayrollAction(month, year);
      if (!draftRes.success || !draftRes.data) {
        throw new Error("Failed to generate payroll calculation for freeze.");
      }

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

      if (snapshotsInsertError) throw new Error(`Failed to insert payroll snapshots: ${snapshotsInsertError.message}`);

      // 3.4 Ensure salary_slips bucket exists
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      if (bucketsError) throw new Error("Validation Error: Storage bucket is not available.");
      const bucketExists = buckets.some((b: any) => b.name === 'salary_slips');
      if (!bucketExists) {
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket('salary_slips', { public: true });
        if (createBucketError) throw new Error("Validation Error: Storage bucket is not available.");
      }

      // 3.5 Generate Salary Slips (PDFs) and Store in salary_slips table
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { SalarySlipPDF } = await import('@/components/pdf/SalarySlipPDF');
      const salarySlipsToInsert = [];

      for (const snap of frozenSnapshots) {
        const pdfElement = createElement(SalarySlipPDF, {
          employeeName: snap.employee_name,
          designation: snap.designation || 'Employee',
          month,
          year,
          grossSalary: snap.gross_salary || 0,
          totalDeductions: snap.total_deductions || 0,
          netPayable: snap.net_payable
        });
        
        let uploadData, uploadError;
        let fileName = `${year}/${month}/${snap.employee_id}/salary-slip.pdf`;
        try {
          const pdfBuffer = await renderToBuffer(pdfElement);
          
          const result = await supabaseAdmin.storage
            .from('salary_slips')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false
            });
          uploadData = result.data;
          uploadError = result.error;
        } catch (err: any) {
          uploadError = err;
          console.error(`[lockPayrollCycleAction] Caught generation/upload exception for ${snap.employee_id}:`, err);
        }
          
        if (uploadError) {
          console.error(`[lockPayrollCycleAction] Error processing salary slip for ${snap.employee_id}:`, uploadError);
          throw new Error(`Failed to process salary slip for ${snap.employee_name}: ${uploadError.message || 'Unknown error'}`);
        }

        let pdfUrl = null;
        if (uploadData) {
          uploadedFileNames.push(fileName);
          const { data: publicUrlData } = supabaseAdmin.storage.from('salary_slips').getPublicUrl(fileName);
          pdfUrl = publicUrlData.publicUrl;
        }

        salarySlipsToInsert.push({
          employee_id: snap.employee_id,
          cycle_id: cycleId,
          snapshot_id: snap.id,
          pdf_url: pdfUrl,
          generated_by: profile.id
        });
        
        await logPayrollEvent(
          "SALARY_SLIP_GENERATED",
          snap.employee_id,
          { employee_id: snap.employee_id, cycle_id: cycleId, snapshot_id: snap.id, month, year },
          "info"
        );
      }

      if (salarySlipsToInsert.length > 0) {
        const { error: slipsInsertError } = await supabaseAdmin
          .from('salary_slips')
          .insert(salarySlipsToInsert);
        if (slipsInsertError) {
          throw new Error(`Error inserting salary slips: ${slipsInsertError.message}`);
        }
      }

      // 4. Finalize the Lock
      const { error: finalizeError } = await supabaseAdmin
        .from('payroll_cycles')
        .update({ status: 'locked' })
        .eq('id', cycleId);

      if (finalizeError) throw new Error(`Failed to finalize payroll lock: ${finalizeError.message}`);

      // 5. Admin Audit Logging
      await logPayrollEvent(
        "PAYROLL_CYCLE_LOCKED",
        null,
        { month, year, snapshot_count: frozenSnapshots.length, cycle_id: cycleId },
        "critical"
      );

      revalidatePath("/admin/payroll");
      revalidatePath("/hr/payroll");

      if (bankId) {
        const { syncBankBalance } = await import("@/actions/bank.actions");
        await syncBankBalance(bankId);
        const { flagBackdatedReconciliationsAction } = await import("@/actions/reconciliation.actions");
        const transactionDate = new Date(year, month, 0).toISOString().split('T')[0];
        await flagBackdatedReconciliationsAction(bankId, transactionDate, "Payroll Cycle Locked");
      }

      // Send notifications for generated salary slips
      try {
        console.log(`[lockPayrollCycleAction] Triggering salary slip notifications for cycle ${cycleId}...`);
        await notifySalarySlipsAction(cycleId);
      } catch (notifyErr) {
        console.error("[lockPayrollCycleAction] Failed to trigger notifications, but lock was successful:", notifyErr);
      }

      return { success: true, message: `Payroll cycle for ${month}/${year} locked successfully.` };
    } catch (error: any) {
      console.error("[lockPayrollCycleAction] Transaction aborted, initiating rollback:", error);
      
      // Rollback Uploaded Files
      if (uploadedFileNames.length > 0) {
        console.log(`[lockPayrollCycleAction] Rolling back ${uploadedFileNames.length} uploaded files...`);
        try {
          await supabaseAdmin.storage.from('salary_slips').remove(uploadedFileNames);
        } catch (storageErr) {
          console.error("[lockPayrollCycleAction] Rollback of storage files failed:", storageErr);
        }
      }
      
      // Rollback Database Changes
      if (cycleLocked) {
        console.log(`[lockPayrollCycleAction] Rolling back database cycle ${cycleId}...`);
        try {
          if (wasDraft) {
            // Revert back to draft and delete any partial snapshots inserted during processing
            await supabaseAdmin.from('payroll_cycles').update({ status: 'draft', locked_by: null, locked_at: null }).eq('id', cycleId);
            await supabaseAdmin.from('payroll_snapshots').delete().eq('cycle_id', cycleId);
          } else {
            // Delete the completely new cycle (cascades to snapshots and slips)
            await supabaseAdmin.from('payroll_cycles').delete().eq('id', cycleId);
          }
        } catch (dbErr) {
          console.error("[lockPayrollCycleAction] Rollback of database cycle failed:", dbErr);
        }
      }

      return { success: false, error: error.message };
    }
  } catch (error: any) {
    console.error("[lockPayrollCycleAction] Fatal Error:", error);
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

    // 0. Clean up storage files for this cycle
    const { data: slipsToDelete } = await supabaseAdmin
      .from('salary_slips')
      .select('pdf_url, employee_id, snapshot_id, cycle_id')
      .eq('cycle_id', existing.id);

    if (slipsToDelete && slipsToDelete.length > 0) {
      for (const s of slipsToDelete) {
        await logPayrollEvent("SALARY_SLIP_DELETED", s.employee_id, { employee_id: s.employee_id, cycle_id: s.cycle_id, snapshot_id: s.snapshot_id, month, year }, "warning");
      }
      
      const filePaths = slipsToDelete
        .map((s: any) => {
          if (!s.pdf_url) return null;
          return getStoragePathFromUrl(s.pdf_url);
        })
        .filter(Boolean);
        
      if (filePaths.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
          .from('salary_slips')
          .remove(filePaths);
        if (removeError) {
          console.error("[unlockPayrollCycleAction] Failed to delete storage files:", removeError);
        }
      }
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
    await logPayrollEvent(
      "PAYROLL_CYCLE_UNLOCKED",
      null,
      { month, year, cycle_id: existing.id },
      "critical"
    );

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

/**
 * getMySalarySlipsAction
 * Fetches salary slips for the logged in employee.
 * Leverages RLS to automatically scope to the authenticated user.
 */
export async function getMySalarySlipsAction() {
  try {
    const supabase = await createClient();
    
    // We join with payroll_cycles to get the month and year
    const { data: slips, error } = await supabase
      .from('salary_slips')
      .select(`
        id,
        pdf_url,
        status,
        generated_at,
        employee_id,
        snapshot_id,
        cycle:payroll_cycles(month, year)
      `)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    
    // Normalize data to flatten the cycle month/year
    const formattedData = (slips || []).map((s: any) => ({
      id: s.id,
      month: s.cycle?.month,
      year: s.cycle?.year,
      status: s.status,
      pdf_url: s.pdf_url,
      employee_id: s.employee_id,
      snapshot_id: s.snapshot_id,
      generated_at: s.generated_at
    }));

    return { success: true, data: formattedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * emailSalarySlipAction
 * Fetches the salary slip file from storage, mocks an email send, and updates the emailed status.
 */
export async function emailSalarySlipAction(snapshotId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Only System Administrators or HR can email salary slips." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    // 1. Fetch the slip and employee email
    const { data: slip, error: slipError } = await supabaseAdmin
      .from('salary_slips')
      .select('id, pdf_url, employee_id, profiles!salary_slips_employee_id_fkey(email, first_name, last_name)')
      .eq('snapshot_id', snapshotId)
      .single();

    if (slipError || !slip) {
      return { success: false, error: "Validation Error: Salary slip does not exist." };
    }

    if (!slip.pdf_url) {
      return { success: false, error: "Validation Error: Salary slip file does not exist." };
    }

    const employeeEmail = slip.profiles?.email;
    const employeeName = slip.profiles?.first_name ? `${slip.profiles.first_name} ${slip.profiles.last_name || ''}`.trim() : "Employee";

    if (!employeeEmail) {
      return { success: false, error: "Employee does not have a registered email address." };
    }

    // 2. Extract filename from URL (we used public URL)
    const fileName = getStoragePathFromUrl(slip.pdf_url);

    // 3. Download the file from storage securely
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('salary_slips')
      .download(fileName);

    if (downloadError || !fileData) {
      return { success: false, error: "Failed to securely retrieve the salary slip file." };
    }

    // 4. MOCK EMAIL SENDING (using the binary fileData as an attachment)
    console.log(`[MOCK EMAIL] Sending Salary Slip to ${employeeEmail}...`);
    console.log(`[MOCK EMAIL] Attachment: ${fileName} (${fileData.size} bytes)`);
    await new Promise(resolve => setTimeout(resolve, 800)); // simulate network delay

    // 5. Update emailed = true and tracking fields
    const { error: updateError } = await supabaseAdmin
      .from('salary_slips')
      .update({ emailed: true, emailed_at: new Date().toISOString(), emailed_by: profile.id })
      .eq('id', slip.id);

    if (updateError) {
      return { success: false, error: "Email sent, but failed to update status." };
    }

    await logPayrollEvent("SALARY_SLIP_EMAILED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, pdf_url: slip.pdf_url }, "info");

    return { success: true, message: `Salary slip emailed to ${employeeName}.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * generateSignedSalarySlipUrlAction
 * Generates a temporary signed URL for a salary slip.
 */
export async function generateSignedSalarySlipUrlAction(snapshotId: string, expiresInSeconds: number = 3600) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Unauthorized access." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data: slip, error: slipError } = await supabaseAdmin
      .from('salary_slips')
      .select('pdf_url, employee_id, cycle_id, download_count')
      .eq('snapshot_id', snapshotId)
      .single();

    if (slipError || !slip || !slip.pdf_url) {
      return { success: false, error: "Validation Error: Salary slip does not exist." };
    }

    // Extract filename from stored url/path
    const fileName = getStoragePathFromUrl(slip.pdf_url);

    const { data, error } = await supabaseAdmin.storage
      .from('salary_slips')
      .createSignedUrl(fileName, expiresInSeconds);

    if (error || !data) {
      return { success: false, error: "Validation Error: Signed URL generation failed." };
    }

    const newCount = (slip.download_count || 0) + 1;
    await supabaseAdmin
      .from('salary_slips')
      .update({ last_downloaded_at: new Date().toISOString(), download_count: newCount })
      .eq('snapshot_id', snapshotId);

    await logPayrollEvent("SALARY_SLIP_DOWNLOADED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");

    return { success: true, signedUrl: data.signedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * markSalarySlipSharedAction
 * Updates the shared status of a salary slip in the database.
 */
export async function markSalarySlipSharedAction(snapshotId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Unauthorized access." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data: slipToShare } = await supabaseAdmin.from('salary_slips').select('employee_id, cycle_id').eq('snapshot_id', snapshotId).single();

    const { error } = await supabaseAdmin
      .from('salary_slips')
      .update({ shared: true, shared_at: new Date().toISOString() })
      .eq('snapshot_id', snapshotId);

    if (error) throw error;
    
    if (slipToShare) {
      await logPayrollEvent("SALARY_SLIP_SHARED", slipToShare.employee_id, { employee_id: slipToShare.employee_id, snapshot_id: snapshotId, cycle_id: slipToShare.cycle_id }, "info");
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * getSalarySlipsStatusAction
 * Fetches the status of all salary slips for a given cycle.
 */
export async function getSalarySlipsStatusAction(cycleId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Unauthorized access." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('salary_slips')
      .select('id, employee_id, snapshot_id, emailed, shared, status')
      .eq('cycle_id', cycleId);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalarySlipUrlAction(snapshotId: string, employeeId: string, month: number, year: number) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (!['admin', 'hr'].includes(profile.role?.toLowerCase()) && profile.id !== employeeId) {
      return { success: false, error: 'Validation Error: Employee does not have permission.' };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data: slip, error } = await supabaseAdmin
      .from('salary_slips')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .single();

    if (error || !slip) {
      return { success: false, error: "Validation Error: Salary slip does not exist." };
    }

    // Determine extension based on stored URL if possible, fallback to .pdf
    let fileName = `salary_slip_${employeeId}_${month}_${year}.pdf`;
    if (slip.pdf_url) {
      fileName = getStoragePathFromUrl(slip.pdf_url);
    }
    
    let signedUrlData, signedUrlError;
    try {
      const result = await supabaseAdmin.storage
        .from('salary_slips')
        .createSignedUrl(fileName, 60 * 60);
      signedUrlData = result.data;
      signedUrlError = result.error;
    } catch (err: any) {
      signedUrlError = err;
      console.error(`[getSalarySlipUrlAction] Caught signed URL exception for ${employeeId}:`, err);
    }

    if (signedUrlError) {
      console.error("[getSalarySlipUrlAction] Storage error:", signedUrlError);
      if (slip.pdf_url) {
        await supabaseAdmin.from('salary_slips').update({ last_viewed_at: new Date().toISOString() }).eq('snapshot_id', snapshotId);
        await logPayrollEvent("SALARY_SLIP_VIEWED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");
        return { success: true, url: slip.pdf_url };
      }
      return { success: false, error: "Validation Error: File does not exist in storage." };
    }

    await supabaseAdmin.from('salary_slips').update({ last_viewed_at: new Date().toISOString() }).eq('snapshot_id', snapshotId);
    await logPayrollEvent("SALARY_SLIP_VIEWED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");

    return { success: true, url: signedUrlData.signedUrl };
  } catch (error: any) {
    console.error("[getSalarySlipUrlAction] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * notifySalarySlipsAction
 * Loads salary slips, validates data, and prepares notifications.
 * Does not send notifications yet.
 */
export async function notifySalarySlipsAction(cycleId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Only System Administrators or HR can send notifications." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    // 1. Fetch payroll cycle to get month and year
    const { data: cycle, error: cycleError } = await supabaseAdmin
      .from('payroll_cycles')
      .select('month, year')
      .eq('id', cycleId)
      .single();

    if (cycleError || !cycle) {
      return { success: false, error: "Payroll cycle not found." };
    }

    const { month, year } = cycle;

    // 2. Fetch all slips for the cycle
    const { data: slips, error: slipsError } = await supabaseAdmin
      .from('salary_slips')
      .select('id, employee_id, snapshot_id, pdf_url, profiles!salary_slips_employee_id_fkey(email, first_name, last_name)')
      .eq('cycle_id', cycleId);

    if (slipsError || !slips || slips.length === 0) {
      return { success: false, error: "No salary slips found for this cycle." };
    }

    // 3. Process notifications individually
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    const title = `Salary Slip Available`;
    const message = `Your salary slip for ${monthName} ${year} is now available to view and download.`;

    let successCount = 0;
    let failCount = 0;

    for (const slip of slips) {
      try {
        // Send in-app notification
        await sendLocalNotifications([slip.employee_id], title, message, 'payroll', null);
        
        // Update tracking fields
        const { error: updateError } = await supabaseAdmin
          .from('salary_slips')
          .update({
            emailed: true,
            emailed_at: new Date().toISOString(),
            emailed_by: profile.id,
            in_app_notified_at: new Date().toISOString(),
            notification_status: 'Sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', slip.id);
          
        if (updateError) {
          throw new Error("Failed to update tracking fields: " + updateError.message);
        }
        
        // Audit Log for Notification Sent
        await logPayrollEvent(
          "SALARY_SLIP_NOTIFICATION_SENT", 
          slip.employee_id, 
          { cycle_id: cycleId, snapshot_id: slip.snapshot_id }, 
          "info"
        );
        
        successCount++;
      } catch (err: any) {
        console.error(`[notifySalarySlipsAction] Failed to process notification for slip ${slip.id}:`, err);
        // Mark as failed
        await supabaseAdmin
          .from('salary_slips')
          .update({
            notification_status: 'Failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', slip.id);
          
        // Audit Log for Notification Failed
        await logPayrollEvent(
          "SALARY_SLIP_NOTIFICATION_FAILED", 
          slip.employee_id, 
          { cycle_id: cycleId, snapshot_id: slip.snapshot_id, error: err.message }, 
          "warning"
        );
          
        failCount++;
      }
    }

    // 4. Admin Audit Logging
    await logPayrollEvent(
      "SALARY_SLIPS_NOTIFIED",
      null,
      { month, year, cycle_id: cycleId, count: successCount, failed: failCount },
      "info"
    );

    if (failCount > 0) {
      return { 
        success: true, 
        message: `Notified ${successCount} employees, but ${failCount} failed. Check logs.` 
      };
    }

    return { 
      success: true, 
      message: `Successfully notified ${successCount} employees.` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
