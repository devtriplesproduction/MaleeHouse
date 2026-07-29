import React, { Suspense } from "react";
import DashboardLoading from "@/app/(modules)/loading";
import { QuotationWorkspaceContent } from "@/features/accounts/QuotationWorkspaceContent";
import { getProjectByIdAction } from "@/actions/project.actions";
import { getAllQuotationsAction, getQuotationByIdAction } from "@/actions/quotation.actions";

export default async function QuotationWorkspacePage({
  searchParams
}: {
  searchParams: { project?: string; quotation?: string; mode?: string }
}) {
  const projectId = searchParams.project;
  const quotationId = searchParams.quotation;

  let initialProject = null;
  let initialQuotations: any[] = [];

  if (projectId) {
    const res = await getProjectByIdAction(projectId);
    if (res?.data) {
      initialProject = res.data;
    }
  } else if (quotationId) {
    const res = await getQuotationByIdAction(quotationId);
    if (res?.data) {
      const q = res.data;
      initialProject = {
        id: q.id,
        name: q.client_details?.project_title || 'Standalone Quotation',
        client_name: q.client_details?.company_name || 'No Client Details',
        status: 'standalone'
      };
    }
  } else {
    const quotationsRes = await getAllQuotationsAction();
    if (quotationsRes?.data) {
      initialQuotations = quotationsRes.data;
    }
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <QuotationWorkspaceContent 
        initialProject={initialProject}
        initialQuotations={initialQuotations}
      />
    </Suspense>
  );
}
