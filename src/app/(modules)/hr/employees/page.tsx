import { getAllUsersAction } from "@/actions/admin.actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Calendar, Users, Contact } from "lucide-react";
import { PageHeader } from "@/components/modules/PageHeader";
import { cn } from "@/lib/utils";

export default async function EmployeeDirectoryPage() {
  const { data: users, success } = await getAllUsersAction();

  const getBirthdayStatus = (dobStr: string | null | undefined) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    const dobMonth = dob.getMonth();
    const dobDate = dob.getDate();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    if (dobMonth === todayMonth && dobDate === todayDate) {
      return "Today";
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dobMonth === tomorrow.getMonth() && dobDate === tomorrow.getDate()) {
      return "Tomorrow";
    }
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dobThisYear = new Date(today.getFullYear(), dobMonth, dobDate);
    if (dobThisYear >= today && dobThisYear <= nextWeek) {
      return "Upcoming";
    }
    
    return null;
  };

  const sortedUsers = [...(users || [])]
    .filter(u => u.dob && !isNaN(new Date(u.dob).getTime()))
    .sort((a, b) => {
      const dateA = new Date(a.dob);
      const dateB = new Date(b.dob);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let nextA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
      if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
      
      let nextB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
      if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
      
      return nextA.getTime() - nextB.getTime();
    });

  const getStatusBadgeStyles = (status?: string) => {
    switch (status) {
      case "active": return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25";
      case "onboarding_pending": return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25";
      case "invited": return "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/25";
      case "suspended": return "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25";
      case "resigned": return "bg-slate-100 dark:bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/25";
      case "terminated": return "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25";
      default: return "bg-slate-100 dark:bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/25";
    }
  };

  const getRoleBadgeStyles = () => "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25";
  const getDeptBadgeStyles = () => "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/25";

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Employee Directory"
        subtitle="View and search through all personnel profiles and details."
        icon={Contact}
      />

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Personnel List
          </TabsTrigger>
          <TabsTrigger value="birthdays" className="flex items-center gap-2">
            <Gift className="w-4 h-4" /> Birthday Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-[#0c101b]/60">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Personnel List</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A complete list of all users in the system.</p>
            </div>
            
            <div className="overflow-x-auto p-4">
              {success && users ? (
                <table className="w-full text-left border-separate border-spacing-y-2 min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employee</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Role</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Department</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => (
                      <tr 
                        key={user.id}
                        className="group bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase border border-slate-200 dark:border-white/10">
                                {user.first_name?.[0] || '?'}{user.last_name?.[0] || ''}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                {user.first_name} {user.last_name}
                              </span>
                              <span className="text-xs font-mono text-slate-400 mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap", getRoleBadgeStyles())}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap", getDeptBadgeStyles())}>
                            {user.department || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                            getStatusBadgeStyles(user.status || (user.is_active ? 'active' : 'suspended'))
                          )}>
                            {user.status || (user.is_active ? 'active' : 'suspended')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-slate-500 py-12 border border-dashed rounded-xl border-slate-200 dark:border-white/10">
                  Failed to load employees.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="birthdays" className="mt-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-[#0c101b]/60">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" /> Employee Birthdays
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A complete list of all employee birthdates, sorted by upcoming dates.</p>
            </div>

            <div className="overflow-x-auto p-4">
              {success && sortedUsers ? (
                <table className="w-full text-left border-separate border-spacing-y-2 min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employee</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Department</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Date of Birth</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user: any) => {
                      const status = getBirthdayStatus(user.dob);
                      return (
                        <tr 
                          key={`bday-${user.id}`}
                          className="group bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="h-10 w-10 rounded-full bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-sm uppercase border border-slate-200 dark:border-white/10">
                                  {user.first_name?.[0] || '?'}{user.last_name?.[0] || ''}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors leading-snug">
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-xs font-mono text-slate-400 mt-0.5">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap", getDeptBadgeStyles())}>
                              {user.department || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.dob && !isNaN(new Date(user.dob).getTime()) ? (
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {new Date(user.dob).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Not provided</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {status === "Today" && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500 text-white shadow-sm">🎂 Today</span>}
                            {status === "Tomorrow" && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">🎈 Tomorrow</span>}
                            {status === "Upcoming" && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/5">Upcoming</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-slate-500 py-12 border border-dashed rounded-xl border-slate-200 dark:border-white/10">
                  Failed to load employees.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
