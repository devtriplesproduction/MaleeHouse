import React from "react";
import { getBillingWorkspaceDataAction } from "@/actions/finance.actions";
import { BillingWorkspaceLazy } from "@/features/accounts/BillingWorkspaceLazy";

export default async function BillingPage() {
  const { success, data } = await getBillingWorkspaceDataAction();
  
  const initialInvoices = success && data?.invoices ? data.invoices : [];
  const initialMilestones = success && data?.milestones ? data.milestones : [];
  const initialProjectsData = success && data?.projects ? data.projects : [];
  const initialPayments = success && data?.payments ? data.payments : [];

  return (
    <BillingWorkspaceLazy 
      initialInvoices={initialInvoices}
      initialMilestones={initialMilestones}
      initialProjectsData={initialProjectsData}
      initialPayments={initialPayments}
    />
  );
}
