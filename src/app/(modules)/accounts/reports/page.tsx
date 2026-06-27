import React from "react";
import { ReportsGenerator } from "@/features/accounts/ReportsGenerator";

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Financial Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate, view, and export detailed financial statements.
        </p>
      </div>
      
      <ReportsGenerator />
    </div>
  );
}
