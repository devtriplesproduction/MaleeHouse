import React from 'react';

export default function AccountsLoadingState() {
  return (
    <div className="space-y-8 pb-20 animate-pulse">
      {/* Header */}
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-md w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-32"></div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 !mt-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-24 border border-slate-200/60 dark:border-white/5 shadow-sm"></div>
        ))}
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-[400px] border border-slate-200/60 dark:border-white/5"></div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-80 border border-slate-200/60 dark:border-white/5"></div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-64 border border-slate-200/60 dark:border-white/5"></div>
        </div>
        <div className="space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-[600px] border border-slate-200/60 dark:border-white/5"></div>
        </div>
      </div>
    </div>
  );
}
