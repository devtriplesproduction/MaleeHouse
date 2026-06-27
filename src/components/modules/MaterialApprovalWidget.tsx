"use client";

import React, { useState } from "react";
import { Package, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateMaterialRequestStatusAction } from "@/actions/field.actions";

export function MaterialApprovalWidget({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: "approved" | "delivered" | "rejected") => {
    setLoadingId(id);
    const res = await updateMaterialRequestStatusAction(id, status);
    setLoadingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert("Failed to update status: " + res.error);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "requested");

  return (
    <div className="glass-card border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">Material Requests Approval</h3>
        {pendingRequests.length > 0 && (
          <span className="ml-2 px-2 py-0.2 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">
            {pendingRequests.length} Pending
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No material requests found.</p>
        ) : (
          requests.map((mat, idx) => (
            <div key={mat.id || idx} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{mat.item}</p>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                    Qty: {mat.quantity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{mat.project_name}</span> &bull;
                  Req by: {mat.requested_by_name}
                </p>
                {mat.notes && <p className="text-[10px] text-slate-400 mt-1 italic">"{mat.notes}"</p>}
              </div>

              <div className="flex flex-col items-end justify-center ml-4">
                {mat.status === "requested" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(mat.id, "approved")}
                      disabled={loadingId === mat.id}
                      className="px-2 py-1 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded  tracking-wider disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdate(mat.id, "rejected")}
                      disabled={loadingId === mat.id}
                      className="px-2 py-1 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded  tracking-wider disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {mat.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {mat.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-500" />}
                    {mat.status === 'delivered' && <Package className="w-4 h-4 text-indigo-500" />}
                    <span className="text-[10px] uppercase font-bold text-slate-400">{mat.status}</span>
                  </div>
                )}
                {mat.status === "approved" && (
                  <button
                    onClick={() => handleUpdate(mat.id, "delivered")}
                    disabled={loadingId === mat.id}
                    className="mt-2 px-2 py-1 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded uppercase tracking-wider disabled:opacity-50 transition-colors"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
