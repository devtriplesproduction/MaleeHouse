"use client";

import { useState } from "react";
import {
  Landmark,
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import {
  getReconciliationHistoryAction,
  calculateErpBalanceForDateAction,
  saveReconciliationAction,
} from "@/actions/reconciliation.actions";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

interface Props {
  banks: any[];
}

export default function ReconciliationWorkspace({ banks }: Props) {
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [statementDate, setStatementDate] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [erpData, setErpData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  async function selectBank(bank: any) {
    setSelectedBank(bank);
    setErpData(null);
    setStatementDate("");
    setStatementBalance("");
    setNotes("");
    setSaveError(null);
    setSaveSuccess(false);
    setIsAdjusting(false);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    const res = await getReconciliationHistoryAction(bank.id);
    setHistory(res.success ? res.data || [] : []);
  }

  async function handleCalculate() {
    if (!selectedBank || !statementDate) return;
    setIsCalculating(true);
    setSaveError(null);
    setSaveSuccess(false);
    setIsAdjusting(false);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    const res = await calculateErpBalanceForDateAction(selectedBank.id, statementDate);
    setIsCalculating(false);
    if (res.success) setErpData(res.data);
  }

  async function handleSave() {
    if (!selectedBank || !erpData || !statementDate || statementBalance === "") return;
    
    const diff = erpData.erp_balance - Number(statementBalance);
    const isMatched = Math.abs(diff) < 0.01;
    let finalStatus: "matched" | "discrepancy" | "adjusted" = isMatched ? "matched" : "discrepancy";

    if (!isMatched && isAdjusting) {
      if (Number(adjustmentAmount) > Math.abs(diff)) {
        if (!window.confirm("Adjustment amount is greater than the discrepancy difference. Are you sure?")) {
          return;
        }
      }
      if (!adjustmentReason.trim()) {
        setSaveError("Adjustment Reason is required.");
        return;
      }
      finalStatus = "adjusted";
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const res = await saveReconciliationAction({
      bank_id: selectedBank.id,
      statement_date: statementDate,
      statement_balance: Number(statementBalance),
      notes: notes || undefined,
      status: finalStatus,
      adjustment_amount: finalStatus === "adjusted" ? Number(adjustmentAmount) : undefined,
      adjustment_reason: finalStatus === "adjusted" ? adjustmentReason : undefined,
    });
    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      // Reload history
      const hist = await getReconciliationHistoryAction(selectedBank.id);
      setHistory(hist.success ? hist.data || [] : []);
      setErpData(null);
    } else {
      setSaveError(res.error || "Failed to save");
    }
  }

  const difference =
    erpData && statementBalance !== ""
      ? erpData.erp_balance - Number(statementBalance)
      : null;

  const statusColors: Record<string, string> = {
    matched: "text-emerald-500 dark:text-emerald-400",
    discrepancy: "text-rose-500 dark:text-rose-400",
    adjusted: "text-blue-500 dark:text-blue-400",
    unreconciled: "text-amber-500 dark:text-amber-400",
  };

  const statusDot: Record<string, string> = {
    matched: "bg-emerald-400",
    discrepancy: "bg-rose-400",
    adjusted: "bg-blue-400",
    unreconciled: "bg-amber-400",
  };

  const statusLabel: Record<string, string> = {
    matched: "Reconciled",
    discrepancy: "Discrepancy",
    adjusted: "Adjusted",
    unreconciled: "Not Reconciled",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Bank List */}
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Bank Accounts
        </h2>

        {banks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center">
            <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No bank accounts configured.</p>
          </div>
        ) : (
          banks.map((bank: any) => {
            const recStatus: string = bank.reconciliation_status || "unreconciled";
            const isSelected = selectedBank?.id === bank.id;
            return (
              <button
                key={bank.id}
                onClick={() => selectBank(bank)}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 space-y-3 transition-colors",
                  isSelected
                    ? "border-indigo-400 dark:border-indigo-500/60 bg-indigo-50/60 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/30"
                )}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {bank.is_default && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        DEFAULT
                      </span>
                    )}
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>

                {/* Balance row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Opening Balance</span>
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
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account No.</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    ••••{String(bank.account_number || "").slice(-4)}
                  </span>
                </div>

                {/* Status badge */}
                <div className="pt-1 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", statusDot[recStatus] || statusDot.unreconciled)} />
                  <span className={cn("text-[11px] font-semibold", statusColors[recStatus] || statusColors.unreconciled)}>
                    {statusLabel[recStatus] || "Not Reconciled"}
                  </span>
                  {bank.last_reconciled_at && (
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {new Date(bank.last_reconciled_at).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Workspace Panel */}
      <div className="lg:col-span-3 space-y-4">
        {!selectedBank ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center gap-4 min-h-[400px]">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center">
              <Landmark className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                Select a Bank Account
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Choose a bank from the left to begin reconciliation.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Workspace */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {selectedBank.bank_name}
                </p>
                <p className="text-xs text-slate-400">{selectedBank.account_name}</p>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Statement End Date
                  </label>
                  <PremiumDatePicker
                    value={statementDate}
                    onChange={(date) => { setStatementDate(date); setErpData(null); }}
                    triggerClassName="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Statement Balance
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400/50">
                    <span className="px-3 text-sm text-slate-400 font-semibold select-none">₹</span>
                    <input
                      type="number"
                      value={statementBalance}
                      onChange={(e) => setStatementBalance(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={isCalculating || !statementDate}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isCalculating || !statementDate
                    ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                )}
              >
                {isCalculating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                {isCalculating ? "Calculating…" : "Calculate ERP Balance"}
              </button>

              {/* Results */}
              {erpData && (
                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Results</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Opening Balance</p>
                      <p className="font-semibold text-slate-800 dark:text-white nums">{fmt(erpData.opening_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Transactions in Period</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{erpData.transaction_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">ERP Balance</p>
                      <p className="font-semibold text-slate-800 dark:text-white nums">{fmt(erpData.erp_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Statement Balance</p>
                      <p className="font-semibold text-slate-800 dark:text-white nums">
                        {statementBalance !== "" ? fmt(Number(statementBalance)) : "—"}
                      </p>
                    </div>
                  </div>

                  {difference !== null && (
                    <div className="space-y-3 mt-3">
                      <div className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2",
                        Math.abs(difference) < 0.01
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
                          : "bg-rose-50 dark:bg-rose-500/10"
                      )}>
                        <div className="flex items-center gap-2">
                          {Math.abs(difference) < 0.01 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm font-bold nums",
                            Math.abs(difference) < 0.01
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}>
                            {Math.abs(difference) < 0.01
                              ? "Balanced — No Discrepancy"
                              : `Difference: ${fmt(difference)}`}
                          </span>
                        </div>
                      </div>

                      {Math.abs(difference) >= 0.01 && (
                        <div className="space-y-4 pt-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsAdjusting(false)}
                              className={cn(
                                "flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors",
                                !isAdjusting 
                                  ? "border-rose-400 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:border-slate-300"
                              )}
                            >
                              Keep as Discrepancy
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAdjusting(true);
                                if (!adjustmentAmount) setAdjustmentAmount(Math.abs(difference).toString());
                              }}
                              className={cn(
                                "flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors",
                                isAdjusting 
                                  ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:border-slate-300"
                              )}
                            >
                              Record Adjustment
                            </button>
                          </div>

                          {isAdjusting && (
                            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  Adjustment Amount
                                </label>
                                <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                                  <span className="px-3 text-sm text-slate-400 font-semibold select-none">₹</span>
                                  <input
                                    type="number"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="flex-1 bg-transparent py-2 pr-3 text-sm text-slate-900 dark:text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  Adjustment Reason <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                  value={adjustmentReason}
                                  onChange={(e) => setAdjustmentReason(e.target.value)}
                                  rows={2}
                                  placeholder="E.g., Bank charges, Interest credited..."
                                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {erpData && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add reconciliation notes…"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none"
                  />
                </div>
              )}

              {saveError && (
                <p className="text-xs text-rose-500">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reconciliation saved.
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={!erpData || isSaving || statementBalance === ""}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  !erpData || isSaving || statementBalance === ""
                    ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving…" : "Save Reconciliation"}
              </button>
            </div>

            {/* History Table */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">History</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        {["Date", "ERP Balance", "Statement", "Difference", "Adjustment", "Status", "By"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r: any) => (
                        <tr key={r.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {new Date(r.statement_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 nums whitespace-nowrap">
                            {fmt(Number(r.erp_balance))}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 nums whitespace-nowrap">
                            {fmt(Number(r.statement_balance))}
                          </td>
                          <td className={cn("px-4 py-2.5 nums font-semibold whitespace-nowrap", Math.abs(Number(r.difference)) < 0.01 ? "text-emerald-500" : "text-rose-500")}>
                            {fmt(Number(r.difference))}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 nums whitespace-nowrap">
                            {Number(r.adjustment_amount) !== 0 ? fmt(Number(r.adjustment_amount)) : "—"}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={cn(
                              "flex items-center gap-1 font-semibold",
                              statusColors[r.status]
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", statusDot[r.status])} />
                              {statusLabel[r.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                            {r.reconciled_by_profile
                              ? `${r.reconciled_by_profile.first_name} ${r.reconciled_by_profile.last_name}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {history.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
                <p className="text-xs text-slate-400">No reconciliation history for this bank yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
