"use client";

import React from 'react';

export function SyncErrorState() {
  return (
    <div className="w-full h-[500px] flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-rose-500/5 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-rose-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Transmission Interrupted</h3>
      <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs mx-auto">
        We encountered a synchronization error while fetching the project queue. 
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
      >
        Attempt Re-Sync
      </button>
    </div>
  );
}
