'use client';

import React from 'react';
import { FileText, Calendar, User, ExternalLink, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Quotation {
  id: string;
  quotation_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  projects: {
    name: string;
    client_name: string;
  };
}

interface QuotationListProps {
  quotations: Quotation[];
}

export function QuotationList({ quotations }: QuotationListProps) {
  return (
    <div className="overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 backdrop-blur-md">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Client / Project</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Value</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Protocol</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q, i) => (
              <tr 
                key={q.id} 
                className={cn(
                  "group transition-all hover:bg-white/5",
                  i !== quotations.length - 1 && "border-b border-white/5"
                )}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-lg shadow-amber-500/10">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {q.quotation_number || "Q-PENDING"}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">ID: {q.id.split('-')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {q.projects?.client_name || "Prospect Client"}
                    </p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{q.projects?.name}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-bold">
                        {Number(q.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-[0.15em] border-none px-2 py-0.5",
                      q.status === 'Sent' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                    )}>
                      {q.status}
                    </Badge>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button className="p-3 rounded-xl bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group/btn">
                      <ExternalLink className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Active Quotations Found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
