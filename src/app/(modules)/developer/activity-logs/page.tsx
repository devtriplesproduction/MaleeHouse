import { requireRole } from '@/lib/auth-guard';
import { getAuditLogsAction } from '@/actions/admin.actions';
import ActivityLogsTable from './components/ActivityLogsTable';
import { PageHeader } from '@/components/modules/PageHeader';
import { Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Activity Logs | Malee House',
  description: 'Track important activities and changes across the application.',
};

export default async function ActivityLogsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  await requireRole('developer', true);

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const moduleParam = typeof searchParams.module === 'string' ? searchParams.module : undefined;
  const actionParam = typeof searchParams.action === 'string' ? searchParams.action : undefined;

  const logsRes = await getAuditLogsAction({
    page,
    search,
    module: moduleParam,
    action: actionParam,
  });

  const initialData = logsRes.success && logsRes.data ? logsRes.data.items : [];
  const totalPages = logsRes.success && logsRes.data ? logsRes.data.totalPages : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Activity Logs"
        subtitle="Track important activities and audit events across the application."
        icon={Shield}
        iconClassName="text-indigo-600 dark:text-indigo-400"
      />

      <ActivityLogsTable initialData={initialData} totalPages={totalPages} />
    </div>
  );
}
