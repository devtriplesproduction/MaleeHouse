import { getUserProfileAction } from '@/actions/auth.actions';
import { getMyLeavesAction, getAllLeavesAction, getLeaveBalanceAction } from '@/actions/leave.actions';
import { getHolidaysAction } from '@/actions/holiday.actions';
import { LeaveForm } from '@/components/leaves/LeaveForm';
import { LeaveHistory } from '@/components/leaves/LeaveHistory';
import { LeaveMetrics } from '@/components/leaves/LeaveMetrics';
import { AdminLeaveDashboard } from '@/components/leaves/AdminLeaveDashboard';
import { ApplyLeaveButton } from "@/components/modules/ApplyLeaveButton";
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const metadata = {
  title: 'Leave Management | Malee House',
  description: 'Apply for leaves and track status locally.',
};

export default async function LeavesPage() {
  const profile = await getUserProfileAction();
  if (!profile) redirect('/login');

  const isManager = profile.role === 'admin' || profile.role === 'hr';
  
  // For managers, we need both all leaves (for approvals) and their own leaves (for their dashboard)
  const [allLeavesRes, myLeavesRes, balanceRes, holidaysRes] = await Promise.all([
    isManager ? getAllLeavesAction() : Promise.resolve({ success: false, data: [] }),
    getMyLeavesAction(),
    getLeaveBalanceAction(profile.id),
    getHolidaysAction()
  ]);

  const allLeaves = allLeavesRes.success ? allLeavesRes.data : [];
  const myLeaves = myLeavesRes.success ? myLeavesRes.data : [];
  const leaveBalance = balanceRes.success ? (balanceRes.data || 0) : 0;
  const holidays = holidaysRes.success ? (holidaysRes.data || []) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* ── Header Section (Manager Only) ── */}
      {isManager && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 font-sans">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Leave <span className="text-indigo-500">Approvals</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and manage leave requests submitted across all departments.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ApplyLeaveButton initialHolidays={holidays} initialBalance={leaveBalance} initialMyLeaves={myLeaves} />
          </div>
        </div>
      )}

      {isManager ? (
        <Tabs defaultValue="admin" className="w-full mt-4">
          <TabsList className="mb-6 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger value="admin" className="rounded-lg">Dashboard</TabsTrigger>
            <TabsTrigger value="my-leaves" className="rounded-lg">My Leaves</TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin" className="space-y-6">
            <AdminLeaveDashboard initialLeaves={allLeaves} currentUserRole={profile.role} currentUserId={profile.id} />
          </TabsContent>
          
          <TabsContent value="my-leaves" className="space-y-6 animate-in fade-in duration-500">
            <LeaveMetrics leaves={myLeaves} profile={profile} leaveBalance={leaveBalance} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-7 w-full relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
                <LeaveForm initialHolidays={holidays} initialBalance={leaveBalance} initialMyLeaves={myLeaves} />
              </section>
              <section className="lg:col-span-5 w-full flex flex-col space-y-6">
                <LeaveHistory leaves={myLeaves} profile={profile} />
              </section>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <LeaveMetrics leaves={myLeaves} profile={profile} leaveBalance={leaveBalance} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form (Widened) */}
            <section className="lg:col-span-7 w-full relative">
              {/* Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
              <LeaveForm initialHolidays={holidays} initialBalance={leaveBalance} initialMyLeaves={myLeaves} />
            </section>

            {/* Right Column: History */}
            <section className="lg:col-span-5 w-full flex flex-col space-y-6">
              <LeaveHistory leaves={myLeaves} profile={profile} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
