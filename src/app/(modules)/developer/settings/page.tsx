import { requireRole } from '@/lib/auth-guard';
import { Settings } from 'lucide-react';
import { Metadata } from 'next';
import { PageHeader } from '@/components/modules/PageHeader';

export const metadata: Metadata = {
  title: 'Developer Settings | Malee House',
};

export default async function DeveloperSettingsPage() {
  await requireRole('developer', true);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Developer Settings"
        subtitle="Internal developer configuration and preferences."
        icon={Settings}
        iconClassName="text-indigo-600 dark:text-indigo-400"
      />
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Coming Soon</h3>
        <p className="text-slate-500 mt-2">Developer settings panel is currently under development.</p>
      </div>
    </div>
  );
}
