import React from "react";
import { getBankAccountLedgerAction } from "@/actions/bank.actions";
import { getReconciliationHistoryAction } from "@/actions/reconciliation.actions";
import BankDetailsClient from "./BankDetailsClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { bankId: string };
}

export default async function BankDetailsPage({ params }: Props) {
  const { bankId } = params;

  const [ledgerRes, historyRes] = await Promise.all([
    getBankAccountLedgerAction(bankId),
    getReconciliationHistoryAction(bankId),
  ]);

  if (!ledgerRes.success || !ledgerRes.data) {
    return (
      <div className="p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
        <h2 className="text-lg font-bold">Error loading bank details</h2>
        <p className="text-sm mt-1">{ledgerRes.error || "Unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <BankDetailsClient
      initialData={ledgerRes.data}
      history={historyRes.success ? historyRes.data : []}
    />
  );
}
