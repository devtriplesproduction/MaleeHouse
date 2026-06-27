import React from "react";
import { CheckCircle2 } from "lucide-react";

export function EmptyState({ message, icon: Icon = CheckCircle2 }: { message: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-55/40 dark:bg-slate-950/20 text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
