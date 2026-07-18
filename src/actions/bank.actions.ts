"use server";
 
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBankAccountsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveBankAccountAction(payload: any) {
  try {
    const supabase = await createClient();
    
    // If setting this one as default, unset others first
    if (payload.is_default) {
      await (supabase as any)
        .from("bank_accounts")
        .update({ is_default: false })
        .neq("id", payload.id || "00000000-0000-0000-0000-000000000000"); // Just need a valid UUID to satisfy types if no ID
    }

    let bankId = payload.id;
    if (payload.id) {
      // Sanitize the payload to only update editable columns
      const { id, created_at, updated_at, ...updateData } = payload;
      const { error } = await (supabase as any)
        .from("bank_accounts")
        .update(updateData)
        .eq("id", payload.id);
      if (error) throw error;
    } else {
      const { id, created_at, updated_at, ...insertData } = payload;
      const { data, error } = await (supabase as any)
        .from("bank_accounts")
        .insert([insertData])
        .select("id")
        .single();
      if (error) throw error;
      if (data) {
        bankId = data.id;
      }
    }

    if (bankId) {
      await syncBankBalance(bankId);
    }

    revalidatePath("/accounts/banks");
    revalidatePath("/(modules)/(shared)/settings/account");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncBankBalance(bankId: string) {
  try {
    const supabase = await createClient();
    
    // 1. Fetch opening_balance
    const { data: bank, error: bankError } = await (supabase as any)
      .from("bank_accounts")
      .select("opening_balance")
      .eq("id", bankId)
      .single();
    if (bankError) throw bankError;
    if (!bank) throw new Error("Bank account not found");
    const openingBalance = Number(bank.opening_balance || 0);

    // 2. Total Inflow (payments with status = 'verified')
    const { data: payments, error: paymentsError } = await (supabase as any)
      .from("payments")
      .select("amount")
      .eq("bank_id", bankId)
      .eq("status", "verified");
    if (paymentsError) throw paymentsError;
    const totalInflow = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    // 3. Total Expense Outflow
    const { data: expenses, error: expensesError } = await (supabase as any)
      .from("expenses")
      .select("amount")
      .eq("bank_id", bankId);
    if (expensesError) throw expensesError;
    const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    // 4. Total Payroll Outflow from locked cycles
    const { data: lockedCycles, error: cyclesError } = await (supabase as any)
      .from("payroll_cycles")
      .select("id")
      .eq("bank_id", bankId)
      .eq("status", "locked");
    if (cyclesError) throw cyclesError;

    let totalPayroll = 0;
    if (lockedCycles && lockedCycles.length > 0) {
      const cycleIds = lockedCycles.map((c: any) => c.id);
      const { data: snapshots, error: snapshotsError } = await (supabase as any)
        .from("payroll_snapshots")
        .select("net_payable")
        .in("cycle_id", cycleIds);
      if (snapshotsError) throw snapshotsError;
      totalPayroll = (snapshots || []).reduce((sum: number, s: any) => sum + Number(s.net_payable || 0), 0);
    }

    // 5. Calculate and Update current_balance
    const currentBalance = openingBalance + totalInflow - totalExpenses - totalPayroll;
    const { error: updateError } = await (supabase as any)
      .from("bank_accounts")
      .update({ current_balance: currentBalance })
      .eq("id", bankId);
    if (updateError) throw updateError;

    revalidatePath("/accounts/banks");
    revalidatePath("/accounts/reconciliation");
    return { success: true, currentBalance };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function recalculateAllBankBalancesAction() {
  try {
    const supabase = await createClient();
    const { data: banks, error } = await (supabase as any)
      .from("bank_accounts")
      .select("id");
    if (error) throw error;

    for (const bank of (banks || [])) {
      await syncBankBalance(bank.id);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function deleteBankAccountAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/accounts/banks");
    revalidatePath("/(modules)/(shared)/settings/account");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function setDefaultBankAccountAction(id: string) {
  try {
    const supabase = await createClient();
    
    // Unset all first
    const { error: err1 } = await (supabase as any)
      .from("bank_accounts")
      .update({ is_default: false })
      .neq("id", id);
      
    if (err1) throw err1;

    // Set the selected one
    const { error: err2 } = await (supabase as any)
      .from("bank_accounts")
      .update({ is_default: true })
      .eq("id", id);

    if (err2) throw err2;

    revalidatePath("/accounts/banks");
    revalidatePath("/(modules)/(shared)/settings/account");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
