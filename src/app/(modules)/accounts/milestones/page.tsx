import React, { Suspense } from "react";
import { getProjectsWithFinancialsAction } from "@/actions/finance.actions";
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
  
  // Pass ACTIVE_SURVEY_STATUSES to the action so PostgreSQL handles the filtering.
  // Note: If projectIdParam is provided for an inactive project, it won't be returned here, 
  // which is correct as this is the Active Milestones view.
  const projRes = await getProjectsWithFinancialsAction(ACTIVE_SURVEY_STATUSES);

  if (projRes?.success && projRes.data) {
    initialProjects = projRes.data;
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ProjectMilestonesContent initialProjects={initialProjects} />
    </Suspense>
  );
}
