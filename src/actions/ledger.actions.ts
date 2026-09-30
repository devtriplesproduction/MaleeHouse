"use server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfileAction } from "@/actions/auth.actions";
import { revalidatePath } from "next/cache";

export async function getEmployeeLedgerAction(employeeId: string) {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase.from('employee_financial_ledger').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false });
    return { success: !error, data, error: error?.message };
  } catch(e:any) {
    return { success: false, error: e.message };
  }
}

export async function createLedgerEntryAction(employeeId: string, type: string, amount: number, description: string) {
  try {
    const profile: any = await getUserProfileAction();
    const category = ['salary_advance', 'damage'].includes(type) ? 'recoverable' : 'one_time';
    
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin: any = createAdminClient();
    const { error } = await supabaseAdmin.from('employee_financial_ledger').insert({
      employee_id: employeeId,
      adjustment_type: type,
      adjustment_category: category,
      original_amount: amount,
      remaining_amount: amount,
      description,
      status: 'pending',
      created_by: profile.id
    });
    
    if (!error) revalidatePath(`/hr/employees/${employeeId}`);
    return { success: !error, error: error?.message };
  } catch(e:any) {
    return { success: false, error: e.message };
  }
}
