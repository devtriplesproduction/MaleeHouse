import React from "react";
import { getInvoicesAction, getAllMilestonesAction, getProjectBillingSummaryAction, getPaymentsAction } from "@/actions/finance.actions";
import { BillingWorkspaceContent } from "@/features/accounts/BillingWorkspaceContent";

export default async function BillingPage() {
  const [invoiceRes, milestoneRes, projectRes, paymentRes] = await Promise.all([
    getInvoicesAction(),
    getAllMilestonesAction(),
    getProjectBillingSummaryAction(),
    getPaymentsAction()
  ]);
  
  const initialInvoices = invoiceRes?.success && invoiceRes.data ? invoiceRes.data : [];
  const initialMilestones = milestoneRes?.success && milestoneRes.data ? milestoneRes.data : [];
  const initialProjectsData = projectRes?.success && projectRes.data ? projectRes.data : [];
  const initialPayments = paymentRes?.success && paymentRes.data ? paymentRes.data : [];

  return (
    <BillingWorkspaceContent 
      initialInvoices={initialInvoices}
      initialMilestones={initialMilestones}
      initialProjectsData={initialProjectsData}
      initialPayments={initialPayments}
    />
  );
}
