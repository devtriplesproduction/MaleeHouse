import React from "react";
import { OutstandingPaymentsClient } from "@/features/accounts/OutstandingPaymentsClient"; 
import { getOutstandingBalancesAction } from "@/actions/finance.actions";
import { PageHeader } from "@/components/modules/PageHeader";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OutstandingPaymentsPage() {
  const { data: outstandingProjects } = await getOutstandingBalancesAction();

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Outstanding Payments"
        subtitle="Global view of project P&L, outstanding balances, and cost allocations."
        icon={AlertCircle}
      />

      <OutstandingPaymentsClient initialProjects={outstandingProjects || []} />
    </div>
  );
}
