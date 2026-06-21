'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  ChevronDown, 
  Clock, 
  User,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getQuotationVersionsAction } from '@/actions/quotation.actions';

interface QuotationVersionHistoryProps {
  quotationId: string;
  currentVersion: number;
}

const statusConfig: Record<string, string> = {
  Draft: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  Sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'Revision Requested': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export function QuotationVersionHistory({ quotationId, currentVersion }: QuotationVersionHistoryProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    getQuotationVersionsAction(quotationId).then(res => {
      if (res.success) setVersions(res.data || []);
      setLoading(false);
    });
  }, [quotationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 gap-2.5 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Loading Version History…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <History className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Version History</h4>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">{versions.length} immutable snapshot{versions.length !== 1 ? 's' : ''} • Current: V{currentVersion}</p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">No version history available.</p>
        </div>
      ) : (
        <div className="relative mt-6">
          {/* Timeline Line */}
          <div className="absolute left-4.5 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-slate-200 dark:via-white/10 to-transparent" />

          <div className="space-y-3.5 pl-10 pt-6">
            {versions.map((v) => {
              const isLatest = v.version_number === currentVersion;
              const isExpanded = expandedVersion === v.version_number;

              return (
                <div key={v.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-[1.85rem] top-3.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                    isLatest
                      ? "border-indigo-500 bg-indigo-500 shadow-sm"
                      : "border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800"
                  )}>
                    {isLatest && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>

                  <div className={cn(
                    "rounded-xl border transition-all overflow-hidden",
                    isLatest
                      ? "bg-indigo-500/5 border-indigo-500/30"
                      : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                  )}>
                    <button
                      onClick={() => setExpandedVersion(isExpanded ? null : v.version_number)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold nums",
                            isLatest ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-550 dark:text-slate-400"
                          )}>
                            V{v.version_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                {isLatest ? 'Current Version' : `Version ${v.version_number}`}
                              </p>
                              {isLatest && (
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500 text-white text-[8px] font-semibold uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                              <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-semibold border uppercase tracking-wider", statusConfig[v.status] || statusConfig['Draft'])}>
                                {v.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(v.created_at), 'MMM d, yyyy · HH:mm')}
                              </span>
                              {v.creator && (
                                <span className="flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3" />
                                  {v.creator.first_name} {v.creator.last_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-semibold nums text-slate-900 dark:text-white">
                              INR {Number(v.total_amount).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{(v.items || []).length} line items</p>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-white/5 p-4 space-y-4 bg-slate-50/20 dark:bg-black/5">
                        {/* Revision Reason */}
                        {v.revision_reason && (
                          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Revision Reason</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">{v.revision_reason}</p>
                          </div>
                        )}

                        {/* Items Table */}
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> Line Items
                          </p>
                          <div className="space-y-1">
                            {(v.items || []).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 text-xs border border-slate-100 dark:border-white/5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.service_name}</span>
                                <span className="nums font-medium text-slate-500 dark:text-slate-400 shrink-0 ml-4">
                                  {item.quantity} × INR {Number(item.unit_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financials */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Subtotal', value: v.subtotal },
                            { label: `GST (${v.gst_rate}%)`, value: v.gst_amount },
                            { label: 'Grand Total', value: v.total_amount },
                          ].map(({ label, value }) => (
                            <div key={label} className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-center">
                              <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                              <p className="text-xs font-semibold nums text-slate-900 dark:text-white">INR {Number(value).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {v.notes && (
                          <div className="p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Notes & Terms</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
