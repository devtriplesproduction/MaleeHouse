'use client';

import dynamic from 'next/dynamic';

const DispatchOverridesTable = dynamic(
  () =>
    import('@/components/modules/DispatchOverridesTable').then((m) => m.DispatchOverridesTable),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />
    ),
  }
);

export function DispatchOverridesLazy({ requests }: { requests: any[] }) {
  return <DispatchOverridesTable requests={requests} />;
}
