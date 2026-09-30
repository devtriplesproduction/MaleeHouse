"use client";

import React from "react";
import { Loader2, TrendingUp } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
      <div className="relative">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
      </div>
      
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">Synchronizing Workflow</h3>
        <p className="text-sm text-slate-400 font-medium">Fetching real-time intelligence from the survey network...</p>
      </div>

      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
      </div>
    </div>
  );
}
