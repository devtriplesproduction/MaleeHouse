'use client';

import dynamic from 'next/dynamic';

const BillingWorkspaceContent = dynamic(
  () =>
    import('@/features/accounts/BillingWorkspaceContent').then(
      (m) => m.BillingWorkspaceContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] rounded-3xl border border-slate-200/60 dark:border-white/10 animate-pulse bg-slate-50/50 dark:bg-white/5" />
    ),
  }
);

export function BillingWorkspaceLazy(props: {
  initialInvoices: any[];
  initialMilestones: any[];
  initialProjectsData: any[];
  initialPayments?: any[];
}) {
  return <BillingWorkspaceContent {...props} />;
}
