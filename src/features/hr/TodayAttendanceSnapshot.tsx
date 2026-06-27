"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";


export function TodayAttendanceSnapshot({ data, headcount }: { data: any, headcount: number }) {
  const { present = 0, absent = 0, onLeave = 0 } = data || {};
  const totalExpected = headcount - onLeave;
  const presentPercent = totalExpected > 0 ? (present / totalExpected) * 100 : 0;
  
  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
          <CardTitle className="text-base font-bold">Today's Attendance</CardTitle>
        </div>
        <CardDescription className="text-xs">Quick snapshot of daily presence</CardDescription>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
              {presentPercent.toFixed(0)}%
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              Attendance Rate
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {present} / {totalExpected}
            </div>
            <div className="text-xs text-slate-400">Staff Present</div>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-6">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${Math.min(100, Math.max(0, presentPercent))}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 dark:border-white/5 pt-4">
          <div>
            <div className="text-lg font-bold text-emerald-600">{present}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Present</div>
          </div>
          <div className="border-x border-slate-100 dark:border-white/5">
            <div className="text-lg font-bold text-rose-600">{absent}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Absent</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">{onLeave}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">On Leave</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
