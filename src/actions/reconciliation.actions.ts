"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfileAction } from "@/actions/auth.actions";
import { revalidatePath } from "next/cache";

export async function getReconciliationHistoryAction(bankId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("bank_reconciliations")
      .select("*, reconciled_by_profile:profiles!reconciled_by(first_name, last_name), superseded_by_profile:profiles!superseded_by(first_name, last_name)")
      .eq("bank_id", bankId)
      .order("statement_date", { ascending: false });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function flagBackdatedReconciliationsAction(
  bankId: string,
  transactionDate: string,
  triggerType: string
) {
  try {
    const profile = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();
    const { error } = await (supabase as any).rpc("flag_backdated_reconciliations", {
      p_bank_id: bankId,
      p_transaction_date: transactionDate,
      p_trigger_type: triggerType,
      p_triggered_by: profile.id
    });

    if (error) {
      console.error("RPC flag_backdated_reconciliations error:", error);
      return { success: false, error: error.message };
    }
    
    revalidatePath("/accounts");
    return { success: true };
  } catch (err: any) {
    console.error("flagBackdatedReconciliationsAction caught:", err);
    return { success: false, error: err.message };
  }
}

export async function calculateErpBalanceForDateAction(
  bankId: string,
  statementDate: string
) {
  try {
    const supabase = await createClient();

    // opening_balance — constant, no date filter
    const { data: bank, error: bankError } = await (supabase as any)
      .from("bank_accounts")
      .select("opening_balance")
      .eq("id", bankId)
      .single();
    if (bankError) throw bankError;
    const opening_balance = Number(bank.opening_balance || 0);

    // Inflow: verified payments up to statementDate
    const { data: payments, error: paymentsError } = await (supabase as any)
      .from("payments")
      .select("amount")
      .eq("bank_id", bankId)
      .eq("status", "verified")
      .lte("created_at", statementDate);
    if (paymentsError) throw paymentsError;
    const inflow = (payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    // Expense outflow up to statementDate
    const { data: expenses, error: expensesError } = await (supabase as any)
      .from("expenses")
      .select("amount")
      .eq("bank_id", bankId)
      .lte("created_at", statementDate);
    if (expensesError) throw expensesError;
    const expensesTotal = (expenses || []).reduce(
      (sum: number, e: any) => sum + Number(e.amount || 0),
      0
    );

    // Payroll outflow: locked cycles with locked_at <= statementDate
    const { data: lockedCycles, error: cyclesError } = await (supabase as any)
      .from("payroll_cycles")
      .select("id")
      .eq("bank_id", bankId)
      .eq("status", "locked")
      .lte("locked_at", statementDate);
    if (cyclesError) throw cyclesError;

    let payroll = 0;
    if (lockedCycles && lockedCycles.length > 0) {
      const cycleIds = lockedCycles.map((c: any) => c.id);
      const { data: snapshots, error: snapshotsError } = await (supabase as any)
        .from("payroll_snapshots")
        .select("net_payable")
        .in("cycle_id", cycleIds);
      if (snapshotsError) throw snapshotsError;
      payroll = (snapshots || []).reduce(
        (sum: number, s: any) => sum + Number(s.net_payable || 0),
        0
      );
    }

    const erp_balance = opening_balance + inflow - expensesTotal - payroll;
    const transaction_count =
      (payments || []).length +
      (expenses || []).length +
      (lockedCycles || []).length;

    return {
      success: true,
      data: { opening_balance, erp_balance, inflow, expenses: expensesTotal, payroll, transaction_count },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveReconciliationAction(payload: {
  bank_id: string;
  statement_date: string;
  statement_balance: number;
  notes?: string;
  status?: "matched" | "discrepancy" | "adjusted";
  adjustment_amount?: number;
  adjustment_reason?: string;
}) {
  try {
    const supabase = await createClient();

    const calcResult = await calculateErpBalanceForDateAction(
      payload.bank_id,
      payload.statement_date
    );
    if (!calcResult.success || !calcResult.data) throw new Error(calcResult.error);
    const { erp_balance, opening_balance, transaction_count } = calcResult.data;

    const difference = erp_balance - payload.statement_balance;
    const computedStatus = Math.abs(difference) < 0.01 ? "matched" : "discrepancy";

    let finalStatus = computedStatus;
    let finalAdjustmentAmount = 0;
    let finalAdjustmentReason = null;

    if (payload.status === "adjusted") {
      finalStatus = "adjusted";
      finalAdjustmentAmount = payload.adjustment_amount || 0;
      finalAdjustmentReason = payload.adjustment_reason;
      if (!finalAdjustmentReason) {
        throw new Error("Adjustment reason is mandatory when recording an adjustment.");
      }
    } else if (payload.status === "discrepancy") {
      finalStatus = "discrepancy";
    }

    const profile: any = await getUserProfileAction();
    const reconciled_by = profile?.id ?? null;

    const { error: rpcError } = await (supabase as any).rpc("save_reconciliation", {
      p_bank_id: payload.bank_id,
      p_statement_date: payload.statement_date,
      p_statement_balance: payload.statement_balance,
      p_notes: payload.notes ?? null,
      p_status: finalStatus,
      p_adjustment_amount: finalAdjustmentAmount,
      p_adjustment_reason: finalAdjustmentReason ?? null,
      p_reconciled_by: reconciled_by,
      p_opening_balance: opening_balance,
      p_erp_balance: erp_balance,
      p_transaction_count: transaction_count,
    });

    if (rpcError) throw rpcError;

    revalidatePath("/accounts/reconciliation");
    return { success: true, data: { difference, status: finalStatus } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
