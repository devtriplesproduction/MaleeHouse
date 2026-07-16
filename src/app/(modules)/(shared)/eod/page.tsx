import { getUserProfileAction, getStaffMembersAction } from '@/actions/auth.actions';
import { getMyEODReportsAction, getAllEODReportsAction } from '@/actions/eod.actions';
import { EODForm } from '@/components/eod/EODForm';
import { EODHistory } from '@/components/eod/EODHistory';
import { HREODTabs } from '@/components/eod/HREODTabs';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

export const metadata = {
  title: 'EOD Reporting | Malee House',
  description: 'Submit and review end-of-day reports.',
};

export default async function EODPage() {
  const profile = await getUserProfileAction();
  if (!profile) redirect('/login');

  const canReview = profile.role === 'admin' || profile.role === 'hr';

  if (canReview) {
    const [reportsResponse, staff, myReportsResponse] = await Promise.all([
      getAllEODReportsAction(),
      getStaffMembersAction(),
      getMyEODReportsAction()
    ]);
    const reports = reportsResponse.success ? reportsResponse.data : [];
    const myReports = myReportsResponse.success ? myReportsResponse.data : [];

    return (
      <HREODTabs
        reports={reports}
        myReports={myReports}
        staff={staff}
        currentUserId={profile.id}
        currentUserRole={profile.role}
      />
    );
  }

  // Regular user view
  const response = await getMyEODReportsAction();
  const reports = response.success ? response.data : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <EODForm reports={reports} currentUserRole={profile.role} />

      <div className="space-y-6 pt-6 border-t border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2 px-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight text-gray-700 dark:text-gray-200">Recent Logs</h2>
        </div>
        <EODHistory reports={reports} />
      </div>
    </div>
  );
}
