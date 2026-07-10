"use server";

import { createClient } from "@/lib/supabase/server";

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

    if (payload.id) {
      const { error } = await (supabase as any)
        .from("bank_accounts")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any)
        .from("bank_accounts")
        .insert([payload]);
      if (error) throw error;
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

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
