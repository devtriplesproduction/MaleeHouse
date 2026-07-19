"use server";

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from "next/cache";
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf/SalarySlipPDF';
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

    // 3.4 Ensure salary_slips bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    const bucketExists = buckets.some((b: any) => b.name === 'salary_slips');
    if (!bucketExists) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('salary_slips', { public: true });
      if (createBucketError) throw new Error(`Failed to create salary_slips bucket: ${createBucketError.message}`);
    }

    // 3.5 Generate Salary Slips (PDFs) and Store in salary_slips table
    const salarySlipsToInsert = [];
    const uploadedFileNames: string[] = [];

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
      let fileName = `salary_slip_${snap.employee_id}_${month}_${year}.pdf`;
      try {
        const pdfBuffer = await renderToBuffer(pdfElement);
        
        const result = await supabaseAdmin.storage
          .from('salary_slips')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        uploadData = result.data;
        uploadError = result.error;
      } catch (err: any) {
        uploadError = err;
        console.error(`[lockPayrollCycleAction] Caught generation/upload exception for ${snap.employee_id}:`, err);
      }
        
      if (uploadError) {
        console.error(`[lockPayrollCycleAction] Error processing salary slip for ${snap.employee_id}:`, uploadError);
        // Atomic Rollback
        if (uploadedFileNames.length > 0) {
          await supabaseAdmin.storage.from('salary_slips').remove(uploadedFileNames);
        }
        await supabaseAdmin.from('payroll_cycles').delete().eq('id', cycleId);
        throw new Error(`Failed to process salary slip for ${snap.employee_name}: ${uploadError.message || 'Unknown error'}`);
      }

      let pdfUrl = null;
      if (uploadData) {
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

      if (uploadData) {
        uploadedFileNames.push(fileName);
      }
    }

    if (salarySlipsToInsert.length > 0) {
      const { error: slipsInsertError } = await supabaseAdmin
        .from('salary_slips')
        .insert(salarySlipsToInsert);
      if (slipsInsertError) {
        console.error(`[lockPayrollCycleAction] Error inserting salary slips:`, slipsInsertError);
        
        // Rollback: delete the successfully uploaded files from storage
        if (uploadedFileNames.length > 0) {
          console.log(`[lockPayrollCycleAction] Rolling back ${uploadedFileNames.length} uploaded files...`);
          await supabaseAdmin.storage.from('salary_slips').remove(uploadedFileNames);
        }
        
        throw new Error(`Error inserting salary slips: ${slipsInsertError.message}`);
      }
    }

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
    console.error("[lockPayrollCycleAction] Final Error:", error);
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
      .select('pdf_url')
      .eq('cycle_id', existing.id);

    if (slipsToDelete && slipsToDelete.length > 0) {
      const filePaths = slipsToDelete
        .map((s: any) => {
          if (!s.pdf_url) return null;
          const parts = s.pdf_url.split('/');
          return parts[parts.length - 1];
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
      return { success: false, error: "Salary slip not found for this snapshot." };
    }

    if (!slip.pdf_url) {
      return { success: false, error: "No PDF generated for this salary slip." };
    }

    const employeeEmail = slip.profiles?.email;
    const employeeName = slip.profiles?.first_name ? `${slip.profiles.first_name} ${slip.profiles.last_name || ''}`.trim() : "Employee";

    if (!employeeEmail) {
      return { success: false, error: "Employee does not have a registered email address." };
    }

    // 2. Extract filename from URL (we used public URL)
    const urlParts = slip.pdf_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

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

    // 5. Update emailed = true
    const { error: updateError } = await supabaseAdmin
      .from('salary_slips')
      .update({ emailed: true })
      .eq('id', slip.id);

    if (updateError) {
      return { success: false, error: "Email sent, but failed to update status." };
    }

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
      .select('pdf_url')
      .eq('snapshot_id', snapshotId)
      .single();

    if (slipError || !slip || !slip.pdf_url) {
      return { success: false, error: "Salary slip file not found." };
    }

    // Extract filename from stored url/path
    const urlParts = slip.pdf_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { data, error } = await supabaseAdmin.storage
      .from('salary_slips')
      .createSignedUrl(fileName, expiresInSeconds);

    if (error || !data) {
      return { success: false, error: "Failed to generate secure link." };
    }

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

    const { error } = await supabaseAdmin
      .from('salary_slips')
      .update({ shared: true })
      .eq('snapshot_id', snapshotId);

    if (error) throw error;
    
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
      return { success: false, error: 'Unauthorized access to salary slip.' };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    const { data: slip, error } = await supabaseAdmin
      .from('salary_slips')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .single();

    if (error || !slip) {
      return { success: false, error: "Salary slip not generated." };
    }

    // Determine extension based on stored URL if possible, fallback to .pdf
    let fileName = `salary_slip_${employeeId}_${month}_${year}.pdf`;
    if (slip.pdf_url) {
      const urlParts = slip.pdf_url.split('/');
      fileName = urlParts[urlParts.length - 1];
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
      if (slip.pdf_url) return { success: true, url: slip.pdf_url };
      return { success: false, error: "Failed to generate secure file URL." };
    }

    return { success: true, url: signedUrlData.signedUrl };
  } catch (error: any) {
    console.error("[getSalarySlipUrlAction] Error:", error);
    return { success: false, error: error.message };
  }
}
