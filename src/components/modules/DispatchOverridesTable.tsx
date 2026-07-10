"use client";

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { approveDispatchOverrideAction, rejectDispatchOverrideAction } from '@/actions/workflow.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

interface DispatchOverridesTableProps {
  requests: OverrideRequest[];
}

export function DispatchOverridesTable({ requests: initialRequests }: DispatchOverridesTableProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string, projectId: string) => {
    setProcessing(id);
    try {
      const res = await approveDispatchOverrideAction(projectId);
      if (res.success) {
        toast.success("Override approved. Project dispatched.");
        setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
      } else {
        toast.error(res.error || "Failed to approve override.");
      }
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, projectId: string) => {
    setProcessing(id);
    try {
      const res = await rejectDispatchOverrideAction(projectId);
      if (res.success) {
        toast.success("Override rejected.");
        setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
      } else {
        toast.error(res.error || "Failed to reject override.");
      }
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Dispatch Overrides History
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase rounded-xl">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-l-xl">Project</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Date Requested</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No dispatch overrides found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <Link href={`/projects/${req.related_project_id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                      {req.projects?.name || 'Unknown Project'}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {req.projects?.client_name || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    <div className="flex flex-col">
                      <span>{format(new Date(req.created_at), 'MMM d, yyyy')}</span>
                      <span className="text-xs">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {!req.is_read ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-semibold rounded-full">
                        Pending
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-semibold rounded-full">
                        Resolved ({req.projects?.status?.replace(/_/g, ' ') || 'Unknown'})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {!req.is_read ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.related_project_id)}
                          disabled={processing === req.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.related_project_id)}
                          disabled={processing === req.id}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No actions available</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
