'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PendingProjectListCard({ project, showAccept = false }: { project: any, showAccept?: boolean }) {
  // Determine dot color based on operational status
  let dotColor = "bg-indigo-500";
  const statusText = project.operationalBadge?.text || "";

  if (statusText === "Blocked" || statusText === "Returned By QC") {
    dotColor = "bg-rose-500 animate-pulse";
  } else if (statusText === "Ready For Delivery") {
    dotColor = "bg-emerald-500";
  } else if (statusText === "Under Review") {
    dotColor = "bg-purple-500";
  } else if (statusText === "Requires Action") {
    dotColor = "bg-indigo-500";
  } else if (statusText === "In Progress") {
    dotColor = "bg-blue-500";
  }

  // Display status/action label dynamically in the badge
  const badgeLabel = showAccept 
    ? "Awaiting Start" 
    : (project.operationalBadge?.text || "In Progress");

  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-500/30 hover:shadow-md hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", dotColor)} />
        
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
            {project.name}
          </h4>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {project.client_name}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0 ml-4">
        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {badgeLabel}
        </span>
        
        {showAccept ? (
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm shadow-indigo-600/20 transition-all"
          >
            Accept Assignment
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-350 text-[11px] font-bold border border-slate-200/40 dark:border-white/5 transition-all"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function PaginatedProjectList({ projects, showAccept = false, itemsPerPage = 8 }: { projects: any[], showAccept?: boolean, itemsPerPage?: number }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-3 min-h-[320px]">
        {currentProjects.map((p) => (
          <PendingProjectListCard key={p.id} project={p} showAccept={showAccept} />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
          <p className="text-xs text-slate-500 font-bold">
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, projects.length)} of {projects.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
