"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Calendar, Filter, ArrowUpRight, ArrowDownLeft, 
  ChevronLeft, ChevronRight, Landmark, ExternalLink, RefreshCw,
  Clock, AlertCircle, CheckCircle2, History, Scale
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LedgerItem {
  id: string;
  date: string;
  module: "Payment" | "Expense" | "Payroll";
  reference: string;
  description: string;
  category: string;
  credit: number;
  debit: number;
  createdBy: string;
  status: string;
  recordId: string;
}

interface BankDetails {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_usage?: string;
  opening_balance: number;
  current_balance: number;
  last_reconciled_at?: string;
  reconciliation_status?: string;
  last_reconciled_balance?: number;
}

interface Props {
  initialData: {
    bank: BankDetails;
    openingBalance: number;
    currentBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactions: LedgerItem[];
  };
  history: any[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n);

export default function BankDetailsClient({ initialData, history }: Props) {
  const router = useRouter();
  const { bank, totalCredits, totalDebits, transactions } = initialData;

  const [activeTab, setActiveTab] = useState<"transactions" | "reconciliation">("transactions");
  
  // Filters state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "credit" | "debit" | ""
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(q) ||
          item.reference.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    if (moduleFilter) {
      result = result.filter((item) => item.module.toLowerCase() === moduleFilter.toLowerCase());
    }

    if (typeFilter) {
      if (typeFilter === "credit") {
        result = result.filter((item) => item.credit > 0);
      } else if (typeFilter === "debit") {
        result = result.filter((item) => item.debit > 0);
      }
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      result = result.filter((item) => new Date(item.date).getTime() >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((item) => new Date(item.date).getTime() <= toDate.getTime());
    }

    return result;
  }, [transactions, search, moduleFilter, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Frontend route mapper to avoid hardcoded URLs on server
  const getTargetUrl = (module: string, recordId: string) => {
    switch (module) {
      case "Payment":
        return `/accounts/billing`;
      case "Expense":
        return `/accounts/ledger`;
      case "Payroll":
        return `/accounts/payroll`;
      default:
        return `/accounts`;
    }
  };

  const statusColors: Record<string, string> = {
    matched: "text-emerald-500 dark:text-emerald-400",
    discrepancy: "text-rose-500 dark:text-rose-400",
    adjusted: "text-blue-500 dark:text-blue-400",
    unreconciled: "text-amber-500 dark:text-amber-400",
  };

  const statusLabel: Record<string, string> = {
    matched: "Reconciled",
    discrepancy: "Discrepancy",
    adjusted: "Adjusted",
    unreconciled: "Not Reconciled",
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-sans">
      {/* Back to Banks Link */}
      <div>
        <button
          onClick={() => router.push("/accounts/banks")}
          className="text-xs font-bold text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Bank Accounts
        </button>
      </div>

      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-tr from-slate-50 via-white to-indigo-50/20 dark:from-[#0c0f24] dark:via-[#13183a] dark:to-[#0c0f24] p-8 shadow-md">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none opacity-80" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {bank.bank_name}
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mt-1">
                {bank.account_usage || "Operations"} Account &bull; ••••{bank.account_number.slice(-4)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-12 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-white/5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Current Balance</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                {fmt(bank.current_balance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Opening Balance</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                {fmt(bank.opening_balance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Total Credits</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                {fmt(totalCredits)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Total Debits</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 block mt-1">
                {fmt(totalDebits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Balance History Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Last Reconciled Date", 
            value: bank.last_reconciled_at 
              ? format(new Date(bank.last_reconciled_at), "MMM d, yyyy") 
              : "Never Reconciled", 
            icon: Clock, 
            color: "indigo" 
          },
          { 
            label: "Reconciliation Status", 
            value: statusLabel[bank.reconciliation_status || "unreconciled"] || "Not Reconciled", 
            icon: AlertCircle, 
            color: bank.reconciliation_status === "matched" ? "emerald" : "amber",
            valueClass: statusColors[bank.reconciliation_status || "unreconciled"]
          },
          { 
            label: "Last Statement Balance", 
            value: bank.last_reconciled_balance !== undefined && bank.last_reconciled_balance !== null
              ? fmt(Number(bank.last_reconciled_balance)) 
              : "—", 
            icon: Scale, 
            color: "purple" 
          },
          { 
            label: "Current Bank Balance", 
            value: fmt(bank.current_balance), 
            icon: Landmark, 
            color: "emerald" 
          },
        ].map(({ label, value, icon: Icon, color, valueClass }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3 shadow-sm"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                color === "indigo" && "bg-indigo-500/10 text-indigo-500",
                color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                color === "amber" && "bg-amber-500/10 text-amber-500",
                color === "purple" && "bg-purple-500/10 text-purple-500"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
              </p>
              <p className={cn("text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate", valueClass)}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/5">
        <button
          onClick={() => setActiveTab("transactions")}
          className={cn(
            "pb-3 px-6 text-sm font-bold border-b-2 transition-all uppercase tracking-wider",
            activeTab === "transactions"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
          )}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("reconciliation")}
          className={cn(
            "pb-3 px-6 text-sm font-bold border-b-2 transition-all uppercase tracking-wider",
            activeTab === "reconciliation"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
          )}
        >
          Reconciliation History
        </button>
      </div>

      {activeTab === "transactions" ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 p-6 rounded-3xl">
            {/* Search */}
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Search</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Reference, description, category..."
                  className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div className="w-full md:w-44 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Module</label>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={moduleFilter}
                  onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-10 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Modules</option>
                  <option value="payment">Payment</option>
                  <option value="expense">Expense</option>
                  <option value="payroll">Payroll</option>
                </select>
              </div>
            </div>

            {/* Type Filter (Credit / Debit) */}
            <div className="w-full md:w-44 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Type</label>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-10 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Transactions</option>
                  <option value="credit">Credit (Inflow)</option>
                  <option value="debit">Debit (Outflow)</option>
                </select>
              </div>
            </div>

            {/* From Date */}
            <div className="w-full md:w-40 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">From</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="w-full md:w-40 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">To</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            {/* Reset */}
            <div className="w-full md:w-auto">
              <button
                onClick={() => {
                  setSearch("");
                  setModuleFilter("");
                  setTypeFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                }}
                className="h-11 w-full md:w-28 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider border border-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-16 text-center">
              <Landmark className="w-10 h-10 text-slate-350 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                No Transactions Found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No transactions found for this bank account. Try adjusting your search filters.
              </p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Voucher / Ref</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Module</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Category</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Credit</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Debit</th>
                      <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx, idx) => (
                      <tr
                        key={tx.id + idx}
                        onClick={() => router.push(getTargetUrl(tx.module, tx.recordId))}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-indigo-500/[0.02] dark:hover:bg-indigo-500/[0.04] transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                          {format(new Date(tx.date), "MMM d, yyyy")}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-slate-700 dark:text-slate-300 font-semibold max-w-[150px] truncate">
                          {tx.reference}
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border",
                            tx.module === "Payment" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-450 border-emerald-200 dark:border-emerald-500/20",
                            tx.module === "Expense" && "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-455 border-rose-200 dark:border-rose-500/20",
                            tx.module === "Payroll" && "bg-indigo-50 text-indigo-650 dark:bg-indigo-500/10 dark:text-indigo-455 border-indigo-200 dark:border-indigo-500/20"
                          )}>
                            {tx.module}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-white max-w-[280px] truncate font-medium">
                          <div className="flex items-center gap-1.5">
                            {tx.description}
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">
                          {tx.category}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {tx.credit > 0 ? fmt(tx.credit) : "—"}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {tx.debit > 0 ? fmt(tx.debit) : "—"}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {tx.createdBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-955 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-955 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-semibold text-slate-955 dark:text-white">{filteredTransactions.length}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-550 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-550 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2 - Reconciliation History */
        history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-16 text-center">
            <History className="w-10 h-10 text-slate-350 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Reconciliation History
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No reconciliation history available.
            </p>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                    {["Statement Date", "Status", "ERP Balance", "Statement Balance", "Difference", "Reconciled By", "Reconciled On"].map((h) => (
                      <th key={h} className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r: any) => {
                    const statusColors: Record<string, string> = {
                      matched: "text-emerald-600 dark:text-emerald-455",
                      discrepancy: "text-rose-650 dark:text-rose-455",
                      adjusted: "text-blue-650 dark:text-blue-455",
                    };
                    const statusLabels: Record<string, string> = {
                      matched: "Reconciled",
                      discrepancy: "Discrepancy",
                      adjusted: "Adjusted",
                    };
                    
                    return (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-4 px-6 text-sm text-slate-800 dark:text-slate-200 font-medium">
                          {format(new Date(r.statement_date), "MMM d, yyyy")}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold">
                          <span className={cn("inline-flex items-center gap-1.5", statusColors[r.status] || "text-slate-400")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", 
                              r.status === "matched" && "bg-emerald-500",
                              r.status === "discrepancy" && "bg-rose-500",
                              r.status === "adjusted" && "bg-blue-500"
                            )} />
                            {statusLabels[r.status] || r.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-mono font-semibold">
                          {fmt(Number(r.erp_balance))}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-mono font-semibold">
                          {fmt(Number(r.statement_balance))}
                        </td>
                        <td className={cn("py-4 px-6 text-sm font-mono font-semibold", Math.abs(Number(r.difference)) < 0.01 ? "text-emerald-600 dark:text-emerald-455" : "text-rose-655 dark:text-rose-455")}>
                          {fmt(Number(r.difference))}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                          {r.reconciled_by_profile
                            ? `${r.reconciled_by_profile.first_name} ${r.reconciled_by_profile.last_name}`
                            : "—"}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
