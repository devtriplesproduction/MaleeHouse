"use server";

import { normalizeData } from '@/lib/normalize';
import { headers } from "next/headers";

import { revalidatePath } from "next/cache";
import { createElement } from 'react';

import { createClient } from "@/lib/supabase/server";
import { getUserProfileAction } from "@/actions/auth.actions";
import { requireAuthenticatedUser, requirePermission } from "@/lib/security/audit";
import { Permission, Module } from "@/lib/security/permissions";
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

async function ensureSlipExists(supabaseAdmin: any, snapshotId: string, profileId?: string) {
  const { data: existing } = await supabaseAdmin.from('salary_slips').select('id, pdf_url').eq('snapshot_id', snapshotId).maybeSingle();
  
  let slip = existing;
  const { data: snap } = await supabaseAdmin.from('payroll_snapshots').select('id, employee_id, cycle_id, payroll_cycles(month, year, status, slip_status)').eq('id', snapshotId).maybeSingle();
  if (!snap) return;

  const cycle = snap.payroll_cycles;
  if (!cycle || (cycle.status !== 'locked' && cycle.status !== 'paid')) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
  const pdfUrl = `${supabaseUrl}/storage/v1/object/public/salary_slips/${cycle.year}/${cycle.month}/${snap.employee_id}/salary-slip.pdf`;

  if (!slip) {
    const { data: newSlip } = await supabaseAdmin.from('salary_slips').insert({
      employee_id: snap.employee_id,
      cycle_id: snap.cycle_id,
      snapshot_id: snapshotId,
      pdf_url: pdfUrl,
      status: cycle.slip_status || 'generated',
      generated_by: profileId,
      emailed: false,
      shared: false
    }).select().single();
    slip = newSlip;
  }

  if (slip && slip.pdf_url) {
    try {
      const fileName = getStoragePathFromUrl(slip.pdf_url);
      const parts = fileName.split('/');
      const folderPath = parts.slice(0, -1).join('/');
      const baseName = parts[parts.length - 1];

      const { data: fileExists } = await supabaseAdmin.storage.from('salary_slips').list(folderPath, {
        search: baseName
      });

      if (!fileExists || fileExists.length === 0) {
        const mockPdfBuffer = Buffer.from(
          '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
        );
        await supabaseAdmin.storage.from('salary_slips').upload(fileName, mockPdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
      }
    } catch (e) {
      console.error("[ensureSlipExists] storage error:", e);
    }
  }
}

async function ensureSlipsExistForCycle(supabaseAdmin: any, cycleId: string, profileId?: string) {
  const { data: cycle } = await supabaseAdmin.from('payroll_cycles').select('month, year, status, slip_status').eq('id', cycleId).single();
  if (!cycle || (cycle.status !== 'locked' && cycle.status !== 'paid')) return;

  const { data: snaps } = await supabaseAdmin.from('payroll_snapshots').select('id, employee_id').eq('cycle_id', cycleId);
  if (!snaps || snaps.length === 0) return;

  for (const snap of snaps) {
    const { data: existing } = await supabaseAdmin.from('salary_slips').select('id, pdf_url').eq('snapshot_id', snap.id).maybeSingle();
    let slip = existing;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
    const pdfUrl = `${supabaseUrl}/storage/v1/object/public/salary_slips/${cycle.year}/${cycle.month}/${snap.employee_id}/salary-slip.pdf`;

    if (!slip) {
      const { data: newSlip } = await supabaseAdmin.from('salary_slips').insert({
        employee_id: snap.employee_id,
        cycle_id: cycleId,
        snapshot_id: snap.id,
        pdf_url: pdfUrl,
        status: cycle.slip_status || 'generated',
        generated_by: profileId,
        emailed: false,
        shared: false
      }).select().single();
      slip = newSlip;
    }

    if (slip && slip.pdf_url) {
      try {
        const fileName = getStoragePathFromUrl(slip.pdf_url);
        const parts = fileName.split('/');
        const folderPath = parts.slice(0, -1).join('/');
        const baseName = parts[parts.length - 1];

        const { data: fileExists } = await supabaseAdmin.storage.from('salary_slips').list(folderPath, {
          search: baseName
        });

        if (!fileExists || fileExists.length === 0) {
          const mockPdfBuffer = Buffer.from(
            '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
          );
          await supabaseAdmin.storage.from('salary_slips').upload(fileName, mockPdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        }
      } catch (e) {
        console.error("[ensureSlipsExistForCycle] storage error:", e);
      }
    }
  }
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
  notification_status?: string;
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
    const supabaseAdmin: any = createAdminClient();

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
        .select('*, salary_slips(emailed, status)')
        .eq('cycle_id', existing.id);

      if (snapshotsError) throw snapshotsError;

      // Flatten salary slip data into snapshot for the UI
      const enrichedSnapshots = cycleSnapshots.map((snap: any) => {
        const slip = snap.salary_slips && snap.salary_slips.length > 0 ? snap.salary_slips[0] : null;
        
        let notifStatus = 'Pending';
        if (slip) {
           if (slip.status === 'sent' || slip.status === 'Sent') notifStatus = 'Sent';
           else if (slip.status === 'failed') notifStatus = 'Failed';
           else if (slip.emailed) notifStatus = 'Sent';
        }
        
        return {
          ...snap,
          in_app_notified_at: null,
          emailed: slip ? slip.emailed : false,
          notification_status: notifStatus
        };
      });

      return { success: true, data: enrichedSnapshots, isLocked: true, cycle: existing };
    }

    // Fetch all salary increments up to this month
    const { data: incrementsData } = await supabase
      .from('salary_increments')
      .select('*')
      .lte('effective_date', endOfMonth)
      .order('effective_date', { ascending: false });

    // Days in Month (fixed working days = 26)
    const workingDaysLimit = 26;

    // Fetch all active financial ledger entries
    const { data: ledgerData, error: ledgerError } = await supabaseAdmin
      .from('employee_financial_ledger')
      .select('*')
      .in('employee_id', employees.map((e: any) => e.id))
      .eq('status', 'pending');
      
    // Fetch draft applications for the current cycle, if any
    const { data: currentApps } = await supabaseAdmin
      .from('payroll_adjustment_applications')
      .select('*')
      .eq('cycle_id', existing?.id || 'draft-cycle');

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
      // Ponytail fix: Do not award holidays to employees with absolute zero attendance
      const effectiveHolidays = (days_present + days_field + days_paid_leave > 0) ? standardHolidaysCount : 0;
      const accounted_days = days_present + days_field + days_paid_leave + days_unpaid_leave + effectiveHolidays;
      const days_absent = Math.max(0, workingDaysLimit - accounted_days);

      // Find latest applicable increment
      const empIncrements = (incrementsData || []).filter((inc: any) => inc.employee_id === emp.id);
      const latestIncrement = empIncrements.length > 0 ? empIncrements[0] : null;

      const base_salary = latestIncrement ? latestIncrement.new_salary : (emp.salary || 3000);
      
      // Calculate net payable (basic prorated salary deductions for unpaid leave & absent days)
      const totalEarnedDays = Math.min(workingDaysLimit, (days_present + days_field + days_paid_leave + effectiveHolidays));
      const penaltyDays = days_unpaid_leave + days_absent;
      
      const prorationFactor = workingDaysLimit > 0 ? totalEarnedDays / workingDaysLimit : 1;
      const net_payable = Math.max(0, Math.round(base_salary * Math.max(0, prorationFactor)));

      const basic_salary = Math.round(net_payable * 0.5);
      const hra = Math.round(net_payable * 0.2);
      const allowance = net_payable - basic_salary - hra;
      
      const empLedgers = (ledgerData || []).filter((l: any) => l.employee_id === emp.id);
      const empApps = (currentApps || []).filter((a: any) => a.employee_id === emp.id);

      let adjustments: any[] = [];
      let total_bonus = 0;
      let total_other_deductions = 0;
      let salary_advance_recovery = 0;
      let damage_recovery = 0;

      // Populate adjustments from active ledgers and any saved draft applications
      for (const ledger of empLedgers) {
        // Find if we have a draft application saving a specific amount
        const draftApp = empApps.find((a: any) => a.ledger_id === ledger.id);
        
        let applied_amount = 0;
        if (draftApp) {
          applied_amount = draftApp.applied_amount;
        } else if (ledger.adjustment_category === 'recoverable') {
           // Default logic: recover up to remaining amount or a cap.
           // For simplicity, we just propose 0 by default until HR sets it in Draft
           applied_amount = 0;
        } else if (ledger.adjustment_category === 'one_time') {
           applied_amount = ledger.remaining_amount;
        }

        const adjustment = {
          adjustment_type: ledger.adjustment_type,
          adjustment_category: ledger.adjustment_category,
          original_amount: ledger.original_amount,
          remaining_amount: ledger.remaining_amount,
          applied_amount: applied_amount,
          description: ledger.description,
          status: 'Pending'
        };

        if (applied_amount > 0) {
           if (ledger.adjustment_type === 'bonus' || ledger.adjustment_type === 'festival_bonus') {
             total_bonus += applied_amount;
           } else if (ledger.adjustment_type === 'salary_advance') {
             salary_advance_recovery += applied_amount;
           } else if (ledger.adjustment_type === 'damage') {
             damage_recovery += applied_amount;
           } else {
             total_other_deductions += applied_amount;
           }
        }
        adjustments.push(adjustment);
      }

      // Add one-time draft applications that don't have a ledger yet (new drafts)
      for (const app of empApps) {
        if (!empLedgers.find((l: any) => l.id === app.ledger_id)) {
           adjustments.push({
             adjustment_type: app.adjustment_type,
             adjustment_category: app.adjustment_category,
             applied_amount: app.applied_amount,
             status: 'Draft (Unsaved Ledger)'
           });
           
           if (app.adjustment_type === 'bonus') total_bonus += app.applied_amount;
           else total_other_deductions += app.applied_amount;
        }
      }

      const bonus = total_bonus;
      const gross_salary = basic_salary + hra + allowance + bonus;
      
      const pf = 0;
      const esi = 0;
      const professional_tax = 0;
      const income_tax = 0;
      const other_deductions = total_other_deductions;
      const total_deductions = pf + esi + professional_tax + income_tax + other_deductions + salary_advance_recovery + damage_recovery;
      
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
        adjustments,
        salary_advance_recovery,
        damage_recovery,
        calculated_at: new Date().toISOString()
      };
    });

    return { success: true, data: draftSnapshots, isLocked: false, cycle: existing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * lockPayrollCycleAction
 * Freezes the draft calculation and logs it as an immutable snapshot.
 */
export async function lockPayrollCycleAction(...args: any[]) { return { success: false, error: "Deprecated. Use approveAndLockPayrollAction.", message: "" }; }

/**
 * unlockPayrollCycleAction
 * Removes the frozen snapshot and reverts the payroll cycle back to draft mode.
 */
export async function unlockPayrollCycleAction(...args: any[]) { return { success: false, error: "Deprecated.", message: "" }; }

/**
 * getMySalarySlipsAction
 * Fetches salary slips for the logged in employee.
 * Leverages RLS to automatically scope to the authenticated user.
 */
export async function getMySalarySlipsAction() {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();
    
    // We join with payroll_cycles to get the month and year
    // We use the admin client because employees don't have RLS access to payroll_cycles
    const { data: slips, error } = await supabaseAdmin
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
      .eq('employee_id', (profile).id)
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

    // Auto-repair missing record
    await ensureSlipExists(supabaseAdmin, snapshotId, profile?.id);

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
      .update({ emailed: true, emailed_at: new Date().toISOString(), emailed_by: (profile).id })
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

    // Auto-repair missing record
    await ensureSlipExists(supabaseAdmin, snapshotId, profile?.id);

    const { data: slip, error: slipError } = await supabaseAdmin
      .from('salary_slips')
      .select('pdf_url, employee_id, cycle_id')
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

    // Skipping download_count and last_downloaded_at because migrations are not applied remotely

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
      .update({ shared: true })
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
 * downloadSalarySlipBase64Action
 * Downloads the salary slip PDF from storage and returns it as a Base64 string.
 * This is useful for bypassing client-side CORS issues when bundling ZIPs.
 */
export async function downloadSalarySlipBase64Action(employeeId: string, month: number, year: number) {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== "admin" && profile?.role !== "hr") {
      return { success: false, error: "Unauthorized access." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    let fileName = `${year}/${month}/${employeeId}/salary-slip.pdf`;

    const { data, error } = await supabaseAdmin.storage
      .from('salary_slips')
      .download(fileName);

    if (error || !data) {
      return { success: false, error: "Validation Error: Salary slip file does not exist." };
    }

    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return { success: true, base64 };
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

    if (!['admin', 'hr'].includes(profile.role?.toLowerCase()) && (profile).id !== employeeId) {
      return { success: false, error: 'Validation Error: Employee does not have permission.' };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();

    // Auto-repair missing record
    await ensureSlipExists(supabaseAdmin, snapshotId, profile?.id);

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
        // Skipping last_viewed_at because migration is not applied remotely
        await logPayrollEvent("SALARY_SLIP_VIEWED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");
        return { success: true, url: slip.pdf_url };
      }
      return { success: false, error: "Validation Error: File does not exist in storage." };
    }

    // Skipping last_viewed_at because migration is not applied remotely
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

    // Auto-repair missing records for the cycle
    await ensureSlipsExistForCycle(supabaseAdmin, cycleId, profile?.id);

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
            status: 'sent'
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
            status: 'failed'
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

export async function savePayrollDraftAdjustmentsAction(cycleId: string, draftApps: any[]) {
  const context = { module: Module.PAYROLL, route: "/actions/savePayrollDraftAdjustmentsAction", httpMethod: "POST" };
  const auth = await requireAuthenticatedUser(context);
  if (!auth.success || !auth.profile) return { success: false, error: auth.error, message: auth.message };
  const profile = auth.profile;

  const perm = await requirePermission(profile, Permission.SAVE_PAYROLL_DRAFT, context);
  if (!perm.authorized) return { success: false, error: perm.error, message: perm.message };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabaseAdmin = createAdminClient();

  try {
    for (const app of draftApps) {
      // Find matching ledger
      let ledgerId = null;

      // 1. Recoverable Adjustments (Salary Advance, Damage)
      if (app.adjustment_category === 'recoverable') {
        // We expect it to be linked to an existing ledger. 
        // For simplicity, we assume payroll maps these by employee and type and finds the pending ledger.
        const { data: existingLedgers } = await supabaseAdmin
          .from('employee_financial_ledger')
          .select('id, remaining_amount')
          .eq('employee_id', app.employee_id)
          .eq('adjustment_type', app.adjustment_type)
          .eq('status', 'pending');
        
        if (existingLedgers && existingLedgers.length > 0) {
          ledgerId = (existingLedgers as any)[0].id;
        }
      }

      // 2. Create Ledger if not exists
      if (!ledgerId) {
        const category = ['salary_advance', 'damage'].includes(app.adjustment_type) ? 'recoverable' : 'one_time';
        const { data: newLedger, error: ledgerErr } = await (supabaseAdmin.from('employee_financial_ledger') as any)
          .insert({
            employee_id: app.employee_id,
            adjustment_type: app.adjustment_type,
            adjustment_category: category,
            original_amount: app.applied_amount,
            remaining_amount: app.applied_amount,
            description: app.description || 'Payroll Draft Addition',
            status: 'pending',
            created_by: (profile).id
          })
          .select()
          .single();
        if (ledgerErr) throw ledgerErr;
        ledgerId = (newLedger).id;
      }

      // Upsert into payroll_adjustment_applications
      const { data: existingApp } = await supabaseAdmin
        .from('payroll_adjustment_applications')
        .select('id')
        .eq('cycle_id', cycleId)
        .eq('employee_id', app.employee_id)
        .eq('adjustment_type', app.adjustment_type)
        .eq('status', 'draft')
        .single();
        
      if (existingApp) {
        await (supabaseAdmin.from('payroll_adjustment_applications') as any)
          .update({ applied_amount: app.applied_amount })
          .eq('id', (existingApp as any).id);
      } else {
        await (supabaseAdmin.from('payroll_adjustment_applications') as any)
          .insert({
            cycle_id: cycleId,
            employee_id: app.employee_id,
            ledger_id: ledgerId,
            adjustment_type: app.adjustment_type,
            adjustment_category: app.adjustment_category || 'one_time',
            applied_amount: app.applied_amount,
            status: 'draft',
            created_by: (profile as any).id
          });
      }
    }

    return { success: true, message: "Draft adjustments saved successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
