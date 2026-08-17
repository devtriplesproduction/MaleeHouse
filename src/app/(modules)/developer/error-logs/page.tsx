import { requireRole } from '@/lib/auth-guard';
import { AlertOctagon } from 'lucide-react';
import { Metadata } from 'next';
import ErrorLogsTable from './components/ErrorLogsTable';
import { getErrorLogsAction } from '@/actions/admin.actions';
import { PageHeader } from '@/components/modules/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Error Logs | Malee House',
  description: 'System errors and exceptions.',
};

export default async function ErrorLogsPage() {
  await requireRole('developer', true);
  
  const response = await getErrorLogsAction({ pageSize: 100 });
  const initialData = response.success && response.data ? response.data.items : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Developer Error Logs"
        subtitle="System errors, runtime exceptions, and diagnostics."
        icon={AlertOctagon}
        iconClassName="text-red-600 dark:text-red-400"
      />
      
      <ErrorLogsTable initialData={initialData} />
    </div>
  );
}
