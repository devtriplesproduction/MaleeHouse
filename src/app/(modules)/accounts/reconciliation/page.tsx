import React from "react";
import { getBankAccountsAction } from "@/actions/bank.actions";
import { Landmark, RefreshCw, CheckCircle2, AlertCircle, Clock, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default async function ReconciliationPage() {
  const { data: banks = [] } = await getBankAccountsAction();

  const totalBanks = (banks || []).length;
  const totalBalance = (banks || []).reduce(
    (sum: number, b: any) => sum + Number(b.current_balance || 0),
    0
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Reconciliation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compare bank statement balances with ERP ledger entries to identify discrepancies.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Banks",
            value: String(totalBanks),
            icon: Landmark,
            color: "indigo",
          },
          {
            label: "System Balance",
            value: fmt(totalBalance),
            icon: Scale,
            color: "emerald",
          },
          {
            label: "Last Reconciliation",
            value: "Not run yet",
            icon: Clock,
            color: "amber",
          },
          {
            label: "Overall Status",
            value: "Pending",
            icon: AlertCircle,
            color: "rose",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                color === "indigo" && "bg-indigo-500/10",
                color === "emerald" && "bg-emerald-500/10",
                color === "amber" && "bg-amber-500/10",
                color === "rose" && "bg-rose-500/10"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5",
                  color === "indigo" && "text-indigo-500",
                  color === "emerald" && "text-emerald-500",
                  color === "amber" && "text-amber-500",
                  color === "rose" && "text-rose-500"
                )}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Bank List + Workspace Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bank List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Bank Accounts
          </h2>

          {(banks || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center">
              <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No bank accounts configured.</p>
            </div>
          ) : (
            (banks || []).map((bank: any) => (
              <div
                key={bank.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors"
              >
                {/* Bank header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {bank.bank_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{bank.account_name}</p>
                    </div>
                  </div>
                  {bank.is_default && (
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      DEFAULT
                    </span>
                  )}
                </div>

                {/* Balance row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450 dark:text-slate-400">Opening Balance</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300 nums">
                    {fmt(Number(bank.opening_balance || 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Balance</span>
                  <span className="font-bold text-slate-900 dark:text-white nums">
                    {fmt(Number(bank.current_balance || 0))}
                  </span>
                </div>

                {/* Account number */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account No.</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    ••••{String(bank.account_number || "").slice(-4)}
                  </span>
                </div>

                {/* Status badge */}
                <div className="pt-1 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Not Reconciled
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reconciliation Workspace */}
        <div className="lg:col-span-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center gap-5 min-h-[400px]">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center">
            <Scale className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Reconciliation Workspace
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Run Reconciliation to compare all bank balances with the ERP ledger.
            </p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/30 text-indigo-400 text-sm font-semibold cursor-not-allowed select-none"
          >
            <RefreshCw className="w-4 h-4" />
            Run Reconciliation
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Reconciliation engine coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
