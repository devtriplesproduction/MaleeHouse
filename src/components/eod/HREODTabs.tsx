"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EODForm } from "@/components/eod/EODForm";
import { EODReview } from "@/components/eod/EODReview";
import { ClipboardCheck, BarChart3, Flame } from "lucide-react";

interface HREODTabsProps {
  reports: any[];
  myReports: any[];
  staff: any[];
  currentUserId: string;
  currentUserRole: string;
}

function calculateStreak(reports: any[]) {
  if (!reports || reports.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from(new Set(reports.map((r: any) => r.date))).sort().reverse();
  const latestDate = new Date(dates[0] + 'T00:00:00');
  const diffDays = Math.round((today.getTime() - latestDate.getTime()) / 86400000);
  if (diffDays > 1) return 0;
  let streak = 0;
  let cursor = new Date(today);
  for (const d of dates) {
    const rd = new Date(d + 'T00:00:00');
    const diff = Math.round((cursor.getTime() - rd.getTime()) / 86400000);
    if (diff <= 1) { streak++; cursor = rd; } else break;
  }
  return streak;
}

export function HREODTabs({ reports, myReports, staff, currentUserId, currentUserRole }: HREODTabsProps) {
  const [activeTab, setActiveTab] = useState("review");

  const todayCount = reports.filter(
    (r: any) => r.date === new Date().toISOString().split("T")[0]
  ).length;
  const streak = calculateStreak(myReports);

  return (
    <div className="space-y-6 pb-12">
      <Tabs defaultValue="review" onValueChange={setActiveTab}>
        {/* Header + TabsList in one row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              EOD <span className="text-indigo-500">Reports</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Review team reports or submit your own end-of-day update.</p>
          </div>
          <div className="flex items-center gap-4">
            <TabsList className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 h-11 p-1 rounded-xl">
              <TabsTrigger value="review" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Review EOD
              </TabsTrigger>
              <TabsTrigger value="submit" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Submit EOD
              </TabsTrigger>
            </TabsList>

            {/* Conditionally show Reports Today or Streak badge */}
            {activeTab === "review" ? (
              <div className="inline-flex items-center gap-2.5 h-11 px-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {todayCount} <span className="font-normal text-slate-500 dark:text-slate-400">Reports Today</span>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 h-11 px-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                <Flame className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {streak} <span className="font-normal text-slate-500 dark:text-slate-400">Day Streak</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="review">
          <EODReview reports={reports} staff={staff} currentUserRole={currentUserRole} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="submit" className="mt-6 space-y-12">
          <EODForm
            reports={myReports}
            allReports={reports}
            staff={staff}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            hideHeader
          />
          
          <div className="pt-8 border-t border-slate-200 dark:border-white/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
              My EOD History
            </h2>
            <EODReview 
              reports={myReports} 
              staff={staff} 
              currentUserRole={currentUserRole} 
              currentUserId={currentUserId} 
              hideFilters
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
