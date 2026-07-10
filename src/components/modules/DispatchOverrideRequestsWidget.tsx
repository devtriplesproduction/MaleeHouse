"use client";

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { approveDispatchOverrideAction, rejectDispatchOverrideAction } from '@/actions/workflow.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type OverrideRequest = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  related_project_id: string;
  is_read: boolean;
  projects?: {
    name: string;
    client_name: string;
    status: string;
  } | null;
};

interface DispatchOverrideRequestsWidgetProps {
  requests: OverrideRequest[];
}

export function DispatchOverrideRequestsWidget({ requests: initialRequests }: DispatchOverrideRequestsWidgetProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string, projectId: string) => {
    setProcessing(id);
    try {
      const res = await approveDispatchOverrideAction(projectId);
      if (res.success) {
        toast.success("Override approved. Project dispatched.");
      } else {
        toast.error(res.error || "Failed to approve override.");
      }
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setProcessing(null);
      // We don't filter it out anymore, we just mark it as read
      setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
    }
  };

  const handleReject = async (id: string, projectId: string) => {
    setProcessing(id);
    try {
      const res = await rejectDispatchOverrideAction(projectId);
      if (res.success) {
        toast.success("Override rejected.");
      } else {
        toast.error(res.error || "Failed to reject override.");
      }
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setProcessing(null);
      // We don't filter it out anymore, we just mark it as read
      setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
    }
  };

  if (requests.length === 0) return null;

  const pendingCount = requests.filter(r => !r.is_read).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShieldAlert className="w-32 h-32 text-amber-500" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Dispatch Overrides
          </h3>
        </div>
        <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
          {pendingCount} Pending / {requests.length} Total
        </span>
      </div>

      <div className="space-y-3 relative z-10">
        {requests.map((req) => (
          <div key={req.id} className="p-3 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {req.projects?.name || 'Unknown Project'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Client: {req.projects?.client_name || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Requested {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {!req.is_read ? (
              <div className="flex items-center gap-2 pt-2 border-t border-amber-100 dark:border-amber-500/10">
                <button
                  onClick={() => handleApprove(req.id, req.related_project_id)}
                  disabled={processing === req.id}
                  className="flex-1 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req.id, req.related_project_id)}
                  disabled={processing === req.id}
                  className="w-10 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  title="Reject Override"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2 border-t border-amber-100 dark:border-amber-500/10">
                <span className="flex-1 text-center py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  Resolved ({req.projects?.status?.replace(/_/g, ' ') || 'Unknown'})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
