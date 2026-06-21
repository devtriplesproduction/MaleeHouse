"use client";

import React from "react";
import { useUploadStore } from "@/store/useUploadStore";
import { FileUp, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadMonitor() {
  const { uploads, removeUpload } = useUploadStore();
  const activeUploads = Object.values(uploads);

  if (activeUploads.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-right-4">
      <div className="flex -space-x-1.5">
        {activeUploads.map((upload) => (
          <div 
            key={upload.id}
            className="relative group"
            title={`${upload.fileName}: ${upload.progress}%`}
          >
            {/* Progress Ring */}
            <svg className="w-7 h-7 transform -rotate-90">
              <circle
                cx="14"
                cy="14"
                r="11"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-slate-200 dark:text-white/5"
              />
              <circle
                cx="14"
                cy="14"
                r="11"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={69.1}
                strokeDashoffset={69.1 * (1 - upload.progress / 100)}
                className={cn(
                  "transition-all duration-300",
                  upload.status === "error" ? "text-rose-500" : "text-indigo-500"
                )}
              />
            </svg>
            
            {/* Status Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {upload.status === "success" ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              ) : upload.status === "error" ? (
                <AlertCircle className="w-3 h-3 text-rose-500" />
              ) : (
                <FileUp className="w-3 h-3 text-indigo-500 animate-bounce" />
              )}
            </div>

            {/* Clear Button (only on finish/error) */}
            {(upload.status === "success" || upload.status === "error") && (
              <button 
                onClick={() => removeUpload(upload.id)}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-800 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2 h-2" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {activeUploads.length > 0 && (
        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">
          Vault Sync
        </span>
      )}
    </div>
  );
}
