"use client";

import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      
      <h2 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">Systems Interrupted</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium">
        An unexpected synchronization error occurred. Our engineers have been notified and we're working to restore the data stream.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Attempt Recovery
        </button>
        
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Return to Hub
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-2xl overflow-auto text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Debug Intelligence</p>
          <code className="text-xs text-rose-600 break-all font-mono">
            {error.message || "Unknown system failure"}
          </code>
        </div>
      )}
    </div>
  );
}
