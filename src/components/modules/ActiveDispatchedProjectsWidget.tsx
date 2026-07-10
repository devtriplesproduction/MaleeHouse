"use client";

import React from 'react';
import { Truck, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function ActiveDispatchedProjectsWidget({ projects }: { projects: any[] }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Truck className="w-32 h-32 text-indigo-500" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Active Dispatched Projects
          </h3>
        </div>
        <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full">
          {projects.length} Active
        </span>
      </div>

      <div className="space-y-3 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {projects.map((req) => (
          <Link href={`/projects/${req.id}`} key={req.id}>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col gap-3 transition-colors mb-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {req.name || 'Unknown Project'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Client: {req.client_name || 'N/A'}
                  </p>
                </div>
                <span className="px-2 py-1 bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg uppercase tracking-wider whitespace-nowrap">
                  {req.status?.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {req.updated_at ? formatDistanceToNow(new Date(req.updated_at), { addSuffix: true }) : 'N/A'}
                </div>
                {req.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{req.location}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
