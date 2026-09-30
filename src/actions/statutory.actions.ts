"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserProfileAction } from "@/actions/auth.actions";
import { logAdminAuditAction } from "./admin.actions";

export async function submitBankingDetailsAction(data: { bank_name: string, account_number: string, ifsc_code: string }) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();

    // 1. Basic Validation
    if (!data.bank_name || !data.account_number || !data.ifsc_code) {
      return { success: false, error: "All fields are required" };
    }
    // simple IFSC validation logic
    if (data.ifsc_code.length !== 11) {
      return { success: false, error: "Invalid IFSC format" };
    }

    // 2. Insert new pending row
    // RLS policy bank_insert_own ensures user can only insert for auth.uid()
    const { error } = await (supabase as any).from('employee_bank_details').insert({
      employee_id: profile.id,
      bank_name: data.bank_name,
      account_number: data.account_number,
      ifsc_code: data.ifsc_code,
      status: 'pending',
      is_active: false
    });

    if (error) {
      // Don't log sensitive plaintext account numbers to standard logs
      console.error('Failed to submit banking details', error.message);
      return { success: false, error: "Failed to submit bank details" };
    }

    return { success: true, message: "Banking details submitted for HR approval." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveBankingDetailsAction(recordId: string, employeeId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabaseAdmin: any = createAdminClient();

    // Verify target row is pending
    const { data: targetRecord } = await supabaseAdmin
      .from('employee_bank_details')
      .select('*')
      .eq('id', recordId)
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .single();

    if (!targetRecord) {
      return { success: false, error: "Record not found or not in pending status." };
    }

    // Transactional operation: Deactivate old, approve new. Supabase JS doesn't have true transactions, 
    // so we run sequential updates using Admin client to bypass RLS for this specific orchestration.
    
    // 1. Deactivate old active records
    await supabaseAdmin
      .from('employee_bank_details')
      .update({ is_active: false })
      .eq('employee_id', employeeId)
      .eq('is_active', true);

    // 2. Activate new record
    const { error } = await supabaseAdmin
      .from('employee_bank_details')
      .update({
        status: 'approved',
        is_active: true,
        approved_by: profile.id
      })
      .eq('id', recordId);

    if (error) throw error;

    await logAdminAuditAction({
      action: "BANKING_APPROVED",
      targetUserId: employeeId,
      details: { recordId },
      severity: "info"
    });

    return { success: true, message: "Banking details approved successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectBankingDetailsAction(recordId: string, employeeId: string) {
    try {
      const profile: any = await getUserProfileAction();
      if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
        return { success: false, error: "Unauthorized" };
      }
  
      const supabaseAdmin: any = createAdminClient();
  
      // Verify target row is pending
      const { data: targetRecord } = await supabaseAdmin
        .from('employee_bank_details')
        .select('*')
        .eq('id', recordId)
        .eq('employee_id', employeeId)
        .eq('status', 'pending')
        .single();
  
      if (!targetRecord) {
        return { success: false, error: "Record not found or not in pending status." };
      }
  
      const { error } = await supabaseAdmin
        .from('employee_bank_details')
        .update({
          status: 'rejected',
          is_active: false,
          approved_by: profile.id
        })
        .eq('id', recordId);
  
      if (error) throw error;
  
      await logAdminAuditAction({
        action: "BANKING_REJECTED",
        targetUserId: employeeId,
        details: { recordId },
        severity: "info"
      });
  
      return { success: true, message: "Banking details rejected." };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

export async function submitStatutoryDetailsAction(data: { pan_number: string, uan_number: string }) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();

    if (!data.pan_number && !data.uan_number) {
      return { success: false, error: "At least one field is required" };
    }
    
    // Simple PAN validation logic
    if (data.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan_number)) {
      return { success: false, error: "Invalid PAN format" };
    }

    const { error } = await (supabase as any).from('employee_statutory_details').insert({
      employee_id: profile.id,
      pan_number: data.pan_number,
      uan_number: data.uan_number,
      status: 'pending',
      is_active: false
    });

    if (error) {
      console.error('Failed to submit statutory details', error.message);
      return { success: false, error: "Failed to submit statutory details" };
    }

    return { success: true, message: "Statutory details submitted for HR approval." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveStatutoryDetailsAction(recordId: string, employeeId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabaseAdmin: any = createAdminClient();

    const { data: targetRecord } = await supabaseAdmin
      .from('employee_statutory_details')
      .select('*')
      .eq('id', recordId)
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .single();

    if (!targetRecord) {
      return { success: false, error: "Record not found or not in pending status." };
    }

    await supabaseAdmin
      .from('employee_statutory_details')
      .update({ is_active: false })
      .eq('employee_id', employeeId)
      .eq('is_active', true);

    const { error } = await supabaseAdmin
      .from('employee_statutory_details')
      .update({
        status: 'approved',
        is_active: true,
        approved_by: profile.id
      })
      .eq('id', recordId);

    if (error) throw error;

    await logAdminAuditAction({
      action: "STATUTORY_APPROVED",
      targetUserId: employeeId,
      details: { recordId },
      severity: "info"
    });

    return { success: true, message: "Statutory details approved successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectStatutoryDetailsAction(recordId: string, employeeId: string) {
    try {
      const profile: any = await getUserProfileAction();
      if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
        return { success: false, error: "Unauthorized" };
      }
  
      const supabaseAdmin: any = createAdminClient();
  
      const { data: targetRecord } = await supabaseAdmin
        .from('employee_statutory_details')
        .select('*')
        .eq('id', recordId)
        .eq('employee_id', employeeId)
        .eq('status', 'pending')
        .single();
  
      if (!targetRecord) {
        return { success: false, error: "Record not found or not in pending status." };
      }
  
      const { error } = await supabaseAdmin
        .from('employee_statutory_details')
        .update({
          status: 'rejected',
          is_active: false,
          approved_by: profile.id
        })
        .eq('id', recordId);
  
      if (error) throw error;
  
      await logAdminAuditAction({
        action: "STATUTORY_REJECTED",
        targetUserId: employeeId,
        details: { recordId },
        severity: "info"
      });
  
      return { success: true, message: "Statutory details rejected." };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}
