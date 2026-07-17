import React, { Suspense } from "react";
import { requireRole } from "@/lib/auth-guard";
import { getClientsAction } from "@/features/sales/actions";
import { ClientDirectory } from "@/features/sales/components/ClientDirectory";
import { Building, Users } from "lucide-react";

export default async function ClientsPage() {
  // Allow admin and sales roles
  const { profile } = await requireRole('sales');

  const { data: clientsData } = await getClientsAction();
  
  // Deduplicate by client_name is already done inside getClientsAction now, but just in case
  const clients = Array.from(new Map((clientsData || []).map((item: any) => [item.client_name, item])).values()) as any[];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Client Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Centralized database of all your customer contacts, project history, and relationship profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 shrink-0">
          <div className="flex flex-col items-center justify-center px-3">
            <span className="text-xl font-bold text-slate-800 dark:text-white leading-none">{clients.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Clients</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col items-center justify-center px-3">
            <div className="flex -space-x-1.5 mb-1">
              {clients.slice(0, 3).map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[7px] font-bold text-indigo-600 dark:text-indigo-400 z-10">
                  {c.client_name[0]}
                </div>
              ))}
              {clients.length > 3 && (
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[7px] font-bold text-slate-500">
                  +{clients.length - 3}
                </div>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Active Partners</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px]">
        <Suspense fallback={<div className="h-48 rounded-[2rem] bg-slate-50/30 dark:bg-[#0c101f]/30 border border-slate-200/60 dark:border-white/5 animate-pulse" />}>
          <ClientDirectory clients={clients} userRole={profile.role} />
        </Suspense>
      </div>
    </div>
  );
}
