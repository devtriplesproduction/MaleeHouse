"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { format } from "date-fns";

export function MiniTeamLeaveCalendar({ leaves }: { leaves: any[] }) {
  // Filter for approved leaves happening around now (mock simple logic)
  const approvedLeaves = leaves.filter(l => l.status === 'approved').slice(0, 3);

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <Plane className="h-4.5 w-4.5 text-cyan-500" />
          <CardTitle className="text-base font-bold">Team Leave Calendar</CardTitle>
        </div>
        <CardDescription className="text-xs">Who's off this week</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {approvedLeaves.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center">
            <Plane className="h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">Everyone is in the office!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {approvedLeaves.map((leave, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
                    {leave.profiles?.first_name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {leave.profiles?.first_name} {leave.profiles?.last_name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize mt-0.5">
                      {leave.leave_type} Leave
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                  <div>{format(new Date(leave.start_date), "MMM d")} -</div>
                  <div>{format(new Date(leave.end_date), "MMM d")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
