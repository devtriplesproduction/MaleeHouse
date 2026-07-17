import React from "react";
import { OutstandingPaymentsClient } from "@/features/accounts/OutstandingPaymentsClient"; 
import { getOutstandingBalancesAction } from "@/actions/finance.actions";
import { PageHeader } from "@/components/modules/PageHeader";

export const dynamic = "force-dynamic";

export default async function OutstandingPaymentsPage() {
  const { data: outstandingProjects } = await getOutstandingBalancesAction();

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Master Financial Control Center"
        subtitle="Global view of project P&L, outstanding balances, and cost allocations."
      />

      <OutstandingPaymentsClient initialProjects={outstandingProjects || []} />
    </div>
  );
}
