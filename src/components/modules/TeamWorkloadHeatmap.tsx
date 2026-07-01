"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Zap, AlertCircle } from "lucide-react";

interface WorkloadMember {
  id: string;
  name: string;
  count: number;
  capacity: number;
}

interface TeamWorkloadHeatmapProps {
  data: WorkloadMember[];
}

export function TeamWorkloadHeatmap({ data }: TeamWorkloadHeatmapProps) {
  const getLoadStatus = (count: number, capacity: number) => {
    const ratio = count / capacity;
    if (ratio >= 1) return { label: "Over Capacity", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", bar: "bg-red-500" };
    if (ratio >= 0.7) return { label: "High Load", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", bar: "bg-amber-500" };
    return { label: "Available", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", bar: "bg-emerald-500" };
  };

  return (
    <Card className="enterprise-card">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-indigo-500" />
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100">Resource Planning</Badge>
        </div>
        <CardTitle className="text-xl font-bold">Team Workload Heatmap</CardTitle>
        <CardDescription>Live capacity monitoring for lead engineers.</CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col gap-3">
          {data?.filter((m: any) => m && m.name).map((member) => {
            const safeCount = member.count || 0;
            const safeCapacity = member.capacity || 5;
            const status = getLoadStatus(safeCount, safeCapacity);
            const percentage = Math.min((safeCount / safeCapacity) * 100, 100);

            return (
              <div 
                key={member.id} 
                className={`p-3 sm:p-4 rounded-[1rem] border ${status.bg} ${status.border} transition-all hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar fallback={member.name.split(' ').map((n: any) => n[0]).join('')} className="h-10 w-10 border-2 border-white shadow-sm shrink-0" />
                  <div className="min-w-0 truncate">
                    <p className="font-bold text-slate-900 truncate">{member.name}</p>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${status.color} truncate`}>
                      {status.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto">
                  <div className="flex-1 sm:w-32">
                    <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight mb-1.5">
                      <span>Utilization</span>
                      <span>{Math.round((member.count / member.capacity) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden border border-white">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${status.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{member.count}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Projects</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 opacity-20 text-indigo-500" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest opacity-40">No Active Workloads</p>
            <p className="text-xs font-medium mt-1">Lead engineer capacity will appear here once assigned.</p>
          </div>
        )}
        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            <span className="text-slate-900 font-bold">Admin Tip:</span> High workload members should be prioritized for project completion or reassignment of new intake to ensure quality standards and meeting survey deadlines.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
