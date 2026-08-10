import React, { Suspense } from "react";
import DashboardLoading from "@/app/(modules)/loading";
import { QuotationWorkspaceLazy } from "@/features/accounts/QuotationWorkspaceLazy";
import { getProjectByIdAction } from "@/actions/project.actions";
import { getAllQuotationsAction, getQuotationByIdAction, getQuotationTemplatesAction } from "@/actions/quotation.actions";
import { getStaffMembersAction } from "@/actions/auth.actions";
import { getBankAccountsAction } from "@/actions/bank.actions";

export default async function QuotationWorkspacePage({
  searchParams
}: {
  searchParams: { project?: string; quotation?: string; mode?: string }
}) {
  const projectId = searchParams.project;
  const quotationId = searchParams.quotation;

  let initialProject = null;
  let initialQuotations: any[] = [];
  let initialStaff: any[] = [];
  let initialTemplates: any[] = [];
  let initialBanks: any[] = [];

  const fetches: Promise<any>[] = [
    getStaffMembersAction().then(res => initialStaff = res || []),
    getQuotationTemplatesAction().then(res => initialTemplates = res?.data || []),
    getBankAccountsAction().then(res => initialBanks = res?.data || [])
  ];

  if (projectId) {
    fetches.push(getProjectByIdAction(projectId).then(res => {
      if (res?.data) initialProject = res.data;
    }));
  } else if (quotationId) {
    fetches.push(getQuotationByIdAction(quotationId).then(res => {
      if (res?.data) {
        const q = res.data;
        initialProject = {
          id: q.id,
          name: q.client_details?.project_title || 'Standalone Quotation',
          client_name: q.client_details?.company_name || 'No Client Details',
          status: 'standalone'
        };
      }
    }));
  } else {
    fetches.push(getAllQuotationsAction().then(res => {
      if (res?.data) initialQuotations = res.data;
    }));
  }

  await Promise.all(fetches);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <QuotationWorkspaceLazy 
        initialProject={initialProject}
        initialQuotations={initialQuotations}
        initialStaff={initialStaff}
        initialTemplates={initialTemplates}
        initialBanks={initialBanks}
      />
    </Suspense>
  );
}
