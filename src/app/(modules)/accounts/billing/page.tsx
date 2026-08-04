import React from "react";
export const dynamic = "force-dynamic";
import { getBillingWorkspaceDataAction } from "@/actions/finance.actions";
import { BillingWorkspaceLazy } from "@/features/accounts/BillingWorkspaceLazy";

export default async function BillingPage() {
  const res = await getBillingWorkspaceDataAction();
  const success = res.success;
  const data = res.data;

  const initialInvoices = success && data?.invoices ? data.invoices : [];
  const initialMilestones = success && data?.milestones ? data.milestones : [];
  const initialProjectsData = success && data?.projects ? data.projects : [];
  const initialPayments = success && data?.payments ? data.payments : [];

  return (
    <>
      {!success && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          Failed to load billing data{res.error ? `: ${res.error}` : "."} Try refresh.
        </div>
      )}
      <BillingWorkspaceLazy
        initialInvoices={initialInvoices}
        initialMilestones={initialMilestones}
        initialProjectsData={initialProjectsData}
        initialPayments={initialPayments}
      />
    </>
  );
}
