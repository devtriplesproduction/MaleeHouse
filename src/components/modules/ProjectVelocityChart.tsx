"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface VelocityData {
  stage: string;
  actual: number;
  target: number;
  isDelayed: boolean;
}

interface ProjectVelocityChartProps {
  data: VelocityData[];
}

export function ProjectVelocityChart({ data = [] }: ProjectVelocityChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <Card className="enterprise-card overflow-hidden">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-indigo-500" />
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100">Performance</Badge>
        </div>
        <CardTitle className="text-lg font-bold">Stage Velocity</CardTitle>
        <CardDescription>Actual days spent vs. target duration for completed stages.</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {safeData.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 mx-2 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest opacity-40">Insufficient Data</p>
            <p className="text-xs font-medium mt-1">Velocity will calculate once a stage is completed.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {safeData.map((stage, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 capitalize">{stage.stage.replace('_', ' ')}</span>
                    {stage.isDelayed ? (
                      <Badge variant="destructive" className="h-5 px-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Delayed
                      </Badge>
                    ) : (
                      <Badge variant="success" className="h-5 px-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        On Track
                      </Badge>
                    )}
                  </div>
                  <div className="text-slate-400 font-medium">
                    <span className="text-slate-900 font-bold">{stage.actual}d</span> / {stage.target}d target
                  </div>
                </div>

                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  {/* Target Marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" 
                    style={{ left: `${Math.min((stage.target / Math.max(stage.actual, stage.target)) * 100, 100)}%` }}
                  />
                  
                  {/* Actual Progress Bar */}
                  <div 
                    className={`absolute top-0 bottom-0 rounded-full transition-all duration-1000 ${
                      stage.isDelayed ? 'bg-destructive' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min((stage.actual / Math.max(stage.actual, stage.target)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-50 flex gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                Actual
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-slate-300" />
                Target
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                Over Target
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
