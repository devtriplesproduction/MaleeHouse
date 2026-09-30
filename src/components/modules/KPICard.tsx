import React from 'react';
import { cn } from "@/lib/utils";

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  className?: string;
}

export function KPICard({ label, value, icon: Icon, color, bg, className }: KPICardProps) {
  return (
    <div className={cn("glass-card border-white/10 p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow", className)}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none truncate">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
