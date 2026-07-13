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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Review <span className="text-indigo-500">EOD</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Monitor team performance and daily achievements across departments.
            </p>
          </div>

          <div className="inline-flex items-center gap-2.5 self-start md:self-auto px-5 py-2.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
              {reports.length} <span className="font-normal text-indigo-400 dark:text-indigo-500">Daily Reports</span>
            </span>
          </div>
        </div>

        {/* EOD Form for Admin/HR with Staff Selector */}
        <EODForm reports={myReports} allReports={reports} staff={staff} currentUserId={profile.id} currentUserRole={profile.role} />

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
