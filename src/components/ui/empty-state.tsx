import React from "react";
import { CheckCircle2 } from "lucide-react";

export function EmptyState({ message, icon: Icon = CheckCircle2 }: { message: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-white/[0.01] text-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02]">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 opacity-80" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Data Found</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-500 max-w-[250px] mx-auto">{message}</p>
      </div>
    </div>
  );
}
