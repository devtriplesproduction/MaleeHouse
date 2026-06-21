"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Award, BarChart3 } from "lucide-react";

interface DataPoint {
  day: string;
  amount?: number;
  score?: number;
}

interface RolePerformanceChartProps {
  data: DataPoint[];
  title: string;
  description: string;
  type: "currency" | "percentage" | "count";
  color?: string;
  iconName?: "finance" | "quality" | "performance";
}

const ICON_MAP = {
  finance: BarChart3,
  quality: Award,
  performance: TrendingUp,
};

export function RolePerformanceChart({ 
  data = [], 
  title, 
  description, 
  type,
  color = "indigo",
  iconName = "performance"
}: RolePerformanceChartProps) {
  
  const Icon = ICON_MAP[iconName] || BarChart3;
  
  const maxValue = Math.max(...data.map((d: any) => d.amount ?? d.score ?? 0), 1);

  return (
    <Card className="enterprise-card overflow-hidden h-full">
      <CardHeader className="border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
              color === "indigo" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/10" :
              color === "amber" ? "bg-amber-500/10 text-amber-600 border-amber-500/10" :
              "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
              <CardDescription className="text-xs font-medium">{description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth</p>
            <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="h-[200px] flex items-end justify-between gap-2">
          {data.map((point, idx) => {
            const val = point.amount ?? point.score ?? 0;
            const heightPercentage = (val / maxValue) * 100;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover:-translate-y-2 z-20">
                    <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                      {type === "currency" ? `INR ${Number(val).toLocaleString('en-IN')}` : val}{type === "percentage" && "%"}
                    </div>
                  </div>

                  {/* Bar */}
                  <div 
                    className={cn(
                      "w-full max-w-[32px] rounded-t-xl transition-all duration-1000 ease-out relative overflow-hidden group-hover:brightness-110",
                      color === "indigo" ? "bg-gradient-to-t from-indigo-600 to-indigo-400" :
                      color === "amber" ? "bg-gradient-to-t from-amber-600 to-amber-400" :
                      "bg-gradient-to-t from-emerald-600 to-emerald-400"
                    )}
                    style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  {point.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                color === "indigo" ? "bg-indigo-500" : color === "amber" ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Target</span>
            </div>
          </div>
          <button className="text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline transition-all">
            Full Audit
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
