"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Clock, FileText, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function TodayAttendanceSnapshot({ data, headcount, users = [] }: { data: any, headcount: number, users?: any[] }) {
  const { present = 0, recentEods = [] } = data || {};
  
  // Submitted EODs: pending review first, then approved.
  const pendingEods = recentEods.filter((eod: any) => eod.status !== 'approved');
  const approvedEods = recentEods.filter((eod: any) => eod.status === 'approved');

  // Unsubmitted users: active users who haven't submitted EOD today and are not Admins
  const submittedUserIds = new Set(recentEods.map((eod: any) => eod.user_id));
  const unsubmittedUsers = (users || [])
    .filter((u: any) => u.is_active && u.role?.toLowerCase() !== 'admin')
    .filter((u: any) => !submittedUserIds.has(u.id));

  const totalSubmitted = pendingEods.length + approvedEods.length;
  const totalExpected = totalSubmitted + unsubmittedUsers.length;

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">EOD Review</CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">Daily reports pulse</CardDescription>
            </div>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold tracking-wider py-1 px-2.5 rounded-md">
            {totalSubmitted}/{totalExpected}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-2.5 flex-1 overflow-y-auto thin-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
        {totalExpected === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-4 ring-4 ring-slate-50 dark:ring-slate-900">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-base">No active staff</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">No employees expected for EOD submissions today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pb-2">
            {/* 1. Submitted EODs: Pending Review */}
            {pendingEods.map((eod: any) => (
              <Link 
                key={eod.id} 
                href="/eod" 
                className="group bg-white dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 rounded-xl py-3 px-3 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar 
                    src={eod.profiles?.profile_photo} 
                    fallback={`${eod.profiles?.first_name?.[0] || ""}${eod.profiles?.last_name?.[0] || ""}`}
                    className="h-9 w-9 rounded-full ring-2 ring-slate-50 dark:ring-slate-850 shadow-sm object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {eod.profiles?.first_name} {eod.profiles?.last_name}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Pending Review · Today
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}

            {/* 2. Submitted EODs: Approved */}
            {approvedEods.map((eod: any) => (
              <Link 
                key={eod.id} 
                href="/eod" 
                className="group bg-white dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 rounded-xl py-3 px-3 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar 
                    src={eod.profiles?.profile_photo} 
                    fallback={`${eod.profiles?.first_name?.[0] || ""}${eod.profiles?.last_name?.[0] || ""}`}
                    className="h-9 w-9 rounded-full ring-2 ring-slate-50 dark:ring-slate-850 shadow-sm object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {eod.profiles?.first_name} {eod.profiles?.last_name}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Approved · Today
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}

            {/* 3. Pending Submissions */}
            {unsubmittedUsers.map((user: any) => (
              <Link 
                key={user.id} 
                href="/eod"
                className="group bg-white dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 rounded-xl py-3 px-3 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar 
                      src={user.profile_photo} 
                      fallback={`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`}
                      className="h-9 w-9 rounded-full ring-2 ring-slate-50 dark:ring-slate-850 shadow-sm object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                      Pending Submission
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
