import { getUserProfileAction } from '@/actions/auth.actions';
import { getMyLeavesAction, getAllLeavesAction } from '@/actions/leave.actions';
import { LeaveForm } from '@/components/leaves/LeaveForm';
import { LeaveHistory } from '@/components/leaves/LeaveHistory';
import { LeaveMetrics } from '@/components/leaves/LeaveMetrics';
import { AdminLeaveDashboard } from '@/components/leaves/AdminLeaveDashboard';
import { ApplyLeaveButton } from "@/components/modules/ApplyLeaveButton";
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';

export const metadata = {
  title: 'Leave Management | Malee House',
  description: 'Apply for leaves and track status locally.',
};

export default async function LeavesPage() {
  const profile = await getUserProfileAction();
  if (!profile) redirect('/login');

  const isManager = profile.role === 'admin' || profile.role === 'hr';
  const response = isManager ? await getAllLeavesAction() : await getMyLeavesAction();
  const leaves = response.success ? response.data : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 pt-1 lg:pt-2">
      {/* ── Header Section (Manager Only) ── */}
      {isManager && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 font-sans">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 font-sans">
              Leave <span className="text-indigo-500 font-sans">Approvals</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
              Review and manage leave requests submitted across all departments.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ApplyLeaveButton />
          </div>
        </div>
      )}

      {/* ── Leave Metrics Dashboard (Employee Only, Top Section) ── */}
      {!isManager && (
        <LeaveMetrics leaves={leaves} profile={profile} />
      )}

      {isManager ? (
        <AdminLeaveDashboard initialLeaves={leaves} currentUserRole={profile.role} currentUserId={profile.id} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (Widened) */}
          <section className="lg:col-span-7 w-full relative">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
            <LeaveForm />
          </section>

          {/* Right Column: History */}
          <section className="lg:col-span-5 w-full flex flex-col space-y-6">
            <LeaveHistory leaves={leaves} profile={profile} />
          </section>
        </div>
      )}
    </div>
  );
}
