'use client';

import dynamic from 'next/dynamic';

const QuotationWorkspaceContent = dynamic(
  () =>
    import('@/features/accounts/QuotationWorkspaceContent').then(
      (m) => m.QuotationWorkspaceContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] rounded-3xl border border-slate-200/60 dark:border-white/10 animate-pulse bg-slate-50/50 dark:bg-white/5" />
    ),
  }
);

export function QuotationWorkspaceLazy(props: {
  initialProject: any;
  initialQuotations: any[];
}) {
  return <QuotationWorkspaceContent {...props} />;
}
