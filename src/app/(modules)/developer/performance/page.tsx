import { requireRole } from '@/lib/auth-guard';
import { Gauge } from 'lucide-react';
import { Metadata } from 'next';
import PerformanceDashboard from './components/PerformanceDashboard';
import { getPerformanceMetricsAction } from '@/actions/admin.actions';
import { PageHeader } from '@/components/modules/PageHeader';

export const metadata: Metadata = {
  title: 'Performance | Malee House',
};

export default async function PerformancePage() {
  await requireRole('developer', true);
  
  const response = await getPerformanceMetricsAction({ pageSize: 50 });
  
  const initialData = response.success && response.data ? response.data.items : [];
  const avgResponseTime = response.success && response.data ? response.data.avgResponseTime || 0 : 0;
  const slowestRoutes = response.success && response.data ? response.data.slowestRoutes || [] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Developer Performance"
        subtitle="System latency, request metrics, and performance analytics."
        icon={Gauge}
        iconClassName="text-indigo-600 dark:text-indigo-400"
      />
      
      <PerformanceDashboard 
        initialData={initialData} 
        avgResponseTime={avgResponseTime} 
        slowestRoutes={slowestRoutes} 
      />
    </div>
  );
}
