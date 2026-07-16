"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, FileText, ChevronRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function LeaveApprovalWidget({ leaves }: { leaves: any[] }) {
  const pendingLeaves = leaves.filter((l: any) => l.status === "pending");
  
  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CalendarClock className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Leave Approvals</CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">Requests awaiting review</CardDescription>
            </div>
          </div>
          {pendingLeaves.length > 0 && (
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider py-1 px-2.5 rounded-md">
              {pendingLeaves.length} Pending
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto thin-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
        {pendingLeaves.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-4 ring-4 ring-slate-50 dark:ring-slate-900">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-base">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">No pending leave requests in the queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {pendingLeaves.map((leave: any) => (
              <Link 
                key={leave.id} 
                href="/hr/team" 
                className="p-4 flex items-center justify-between group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar 
                    src={leave.profiles?.profile_photo} 
                    fallback={`${leave.profiles?.first_name?.[0] || ""}${leave.profiles?.last_name?.[0] || ""}`}
                    className="h-10 w-10 rounded-full ring-2 ring-slate-50 dark:ring-slate-850 shadow-sm object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {leave.profiles?.first_name} {leave.profiles?.last_name}
                    </div>
                    <div className="text-xs font-medium text-slate-500 capitalize mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      {leave.leave_type} Leave
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100/50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
