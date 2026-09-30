import React from "react";
import { getSalesPipelineAction } from "@/actions/project.actions";
import { requireRole } from "@/lib/auth-guard";
import { SalesDashboardClient } from "@/features/sales/components/SalesDashboardClient";

export default async function SalesDashboardPage() {
  await requireRole('sales');

  const { data: pipelineData } = await getSalesPipelineAction();
  const leads = pipelineData || [];

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <SalesDashboardClient leads={leads} />
    </div>
  );
}
