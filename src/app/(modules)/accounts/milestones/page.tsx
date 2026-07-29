import React, { Suspense } from "react";
import { getProjectsListAction } from "@/actions/project.actions";
import { getProjectsFinancialSummaryAction } from "@/actions/finance.actions";
import { ProjectMilestonesContent } from "@/features/accounts/ProjectMilestonesContent";
import DashboardLoading from "@/app/(modules)/loading";

const ACTIVE_SURVEY_STATUSES = [
  "payment_pending",
  "payment_done",
  "project_created",
  "data_collection",
  "prototype",
  "review",
  "field_work",
  "data_sync",
  "post_processing",
  "final_review",
  "delivery"
];

export const metadata = {
  title: "Project Milestones | MaleeHouse",
};

export default async function ProjectMilestonesPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialProjects: any[] = [];
  
  const projRes = await getProjectsListAction();

  if (projRes?.success && projRes.data) {
    const projectIdParam = searchParams.project as string;
    
    // Filter to active survey projects (or matching search param)
    const active = projRes.data.filter((p: any) => {
      if (projectIdParam && p.id === projectIdParam) return true;
      return ACTIVE_SURVEY_STATUSES.includes(p.status);
    });

    const activeIds = active.map((p: any) => p.id);
    
    // Fetch aggregated financials sequentially because activeIds are needed
    const finRes = await getProjectsFinancialSummaryAction(activeIds);

    if (finRes?.success && finRes.data) {
      active.forEach((p: any) => {
        const financials = finRes.data[p.id] || { contract_value: 0, received_amount: 0 };
        p.contract_value = financials.contract_value;
        p.received_amount = financials.received_amount;
        p.pending_amount = Math.max(0, financials.contract_value - financials.received_amount);
      });
    }

    initialProjects = active;
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ProjectMilestonesContent initialProjects={initialProjects} />
    </Suspense>
  );
}
