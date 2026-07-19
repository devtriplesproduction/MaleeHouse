import React from "react";
import { getBankAccountsAction } from "@/actions/bank.actions";
import { Landmark, Scale, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReconciliationWorkspace from "@/features/accounts/ReconciliationWorkspace";

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

  const lastReconciled = (banks || [])
    .map((b: any) => b.last_reconciled_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  const overallStatus = (() => {
    const statuses = (banks || []).map((b: any) => b.reconciliation_status || "unreconciled");
    if (statuses.some((s: string) => s === "discrepancy")) return "Discrepancy";
    if (statuses.every((s: string) => s === "matched")) return "All Matched";
    return "Pending";
  })();

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
          { label: "Total Banks", value: String(totalBanks), icon: Landmark, color: "indigo" },
          { label: "System Balance", value: fmt(totalBalance), icon: Scale, color: "emerald" },
          {
            label: "Last Reconciliation",
            value: lastReconciled
              ? new Date(lastReconciled).toLocaleDateString("en-IN")
              : "Not run yet",
            icon: Clock,
            color: "amber",
          },
          { label: "Overall Status", value: overallStatus, icon: AlertCircle, color: "rose" },
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
      <ReconciliationWorkspace banks={banks || []} />
    </div>
  );
}
