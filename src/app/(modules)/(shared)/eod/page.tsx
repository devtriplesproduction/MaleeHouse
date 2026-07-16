import { getUserProfileAction, getStaffMembersAction } from '@/actions/auth.actions';
import { getMyEODReportsAction, getAllEODReportsAction } from '@/actions/eod.actions';
import { EODForm } from '@/components/eod/EODForm';
import { EODHistory } from '@/components/eod/EODHistory';
import { EODReview } from '@/components/eod/EODReview';
import { redirect } from 'next/navigation';
import { Clock, BarChart3 } from 'lucide-react';

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
      <div className="space-y-6 animate-in fade-in duration-700 pb-12">
        {/* EOD Form for Admin/HR with Staff Selector */}
        <EODForm 
          reports={myReports} 
          allReports={reports} 
          staff={staff} 
          currentUserId={profile.id} 
          currentUserRole={profile.role}
          title={<>Review <span className="text-indigo-500">EOD</span></>}
          subtitle="Monitor team performance and daily achievements across departments."
          headerRightContent={
            <div className="inline-flex items-center gap-2.5 h-11 px-5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
                {reports.filter((r: any) => r.date === new Date().toISOString().split('T')[0]).length} <span className="font-normal text-indigo-400 dark:text-indigo-500">Reports Today</span>
              </span>
            </div>
          }
        />

        {/* Review Section */}
        <div className="pt-8 border-t border-slate-200/60 dark:border-white/5">
          <EODReview reports={reports} staff={staff} currentUserRole={profile.role} currentUserId={profile.id} />
        </div>
      </div>
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
