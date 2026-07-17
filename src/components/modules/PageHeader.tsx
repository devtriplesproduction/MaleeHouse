import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName = "text-indigo-500",
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-4", className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          {Icon && <Icon className={cn("w-6 h-6", iconClassName)} />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
