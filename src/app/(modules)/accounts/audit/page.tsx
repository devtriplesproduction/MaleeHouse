import React from "react";
import { ScrollText } from "lucide-react";

export default function AuditPage() {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable trail of all financial actions.
        </p>
      </div>
      <div className="py-20 text-center">
        <ScrollText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Audit log viewer coming soon.
        </p>
      </div>
    </div>
  );
}
