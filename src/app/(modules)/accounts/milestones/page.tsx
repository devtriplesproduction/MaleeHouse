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
  
  const projRes = await getProjectsWithFinancialsAction();

  if (projRes?.success && projRes.data) {
    const projectIdParam = searchParams.project as string;
    
    // Filter to active survey projects (or matching search param)
    const active = projRes.data.filter((p: any) => {
      if (projectIdParam && p.id === projectIdParam) return true;
      return ACTIVE_SURVEY_STATUSES.includes(p.status);
    });

    initialProjects = active;
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ProjectMilestonesContent initialProjects={initialProjects} />
    </Suspense>
  );
}
