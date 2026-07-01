'use client';

import React from 'react';
import { 
  Building2, 
  Wallet,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface ProjectBillingSummary {
  id: string;
  name: string;
  client_name: string;
  status: string;
  budget: number;
  total_invoiced: number;
  total_paid: number;
  pending_balance: number;
}

interface ProjectBillingTableProps {
  projects: ProjectBillingSummary[];
  searchQuery?: string;
  onRefresh?: () => void;
}

export function ProjectBillingTable({ projects, searchQuery = "", onRefresh }: ProjectBillingTableProps) {
  const filtered = projects.filter((project) => {
    if (!searchQuery) return true;
    const projName = project.name || '';
    const clientName = project.client_name || '';
    
    return projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           clientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-3.5">
      {filtered.length === 0 ? (
        <div className="glass-card py-16 text-center text-slate-400 italic text-sm font-medium">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <Briefcase className="w-8 h-8" />
            <span>No projects found.</span>
          </div>
        </div>
      ) : (
        filtered.map((project) => {
          const budget = project.budget || 0;
          const paid = project.total_paid || 0;
          const effectiveBudget = budget > 0 ? budget : (project.total_invoiced > 0 ? project.total_invoiced : 0);
          const percentPaid = effectiveBudget > 0 ? Math.min(100, Math.round((paid / effectiveBudget) * 100)) : 0;
          
          return (
            <div
              key={project.id}
              className="relative rounded-2xl border bg-white dark:bg-[#0f121b] pt-[18px] pb-[18px] pl-3 pr-4 md:py-[15px] md:pl-4 md:pr-6 hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 group border-slate-200/60 dark:border-white/5 shadow-sm"
            >
              {/* Section 1: Project Info (40%) */}
              <div className="flex items-start gap-3 w-full md:w-[40%] flex-shrink-0 md:pr-4 py-0.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 mt-1">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    <span className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight block mb-1.5" title={project.name}>
                      {project.name}
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span>{project.client_name || 'Direct Client'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Finances (40%) */}
              <div className="w-full md:w-[40%] flex-shrink-0 grid grid-cols-3 items-center md:border-l border-slate-100 dark:border-white/5 md:pl-4 md:pr-4 gap-4 md:gap-0">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Budget</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 nums whitespace-nowrap">
                    ₹{budget.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Invoiced</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 nums whitespace-nowrap">
                    ₹{project.total_invoiced.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70 mb-0.5">Paid</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 nums whitespace-nowrap">
                    ₹{paid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Section 3: Balance & Progress (20%) */}
              <div className="w-full md:w-[20%] flex-shrink-0 flex flex-col md:border-l border-slate-100 dark:border-white/5 md:pl-4 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500/70">Pending Balance</span>
                  <span className={cn(
                    "text-sm font-bold nums whitespace-nowrap",
                    project.pending_balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                  )}>
                    ₹{project.pending_balance.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${percentPaid}%` }} 
                    title={`${percentPaid}% of budget collected`}
                  />
                </div>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}
