"use client";

import React, { useState, useEffect } from "react";
import { getInvoicesAction, getAllMilestonesAction } from "@/actions/finance.actions";
import { InvoiceTable } from "@/features/accounts/InvoiceTable";
import { MilestonePaymentsTable } from "@/features/accounts/MilestonePaymentsTable";
import { PaymentReceiptsTable } from "@/features/accounts/PaymentReceiptsTable";
import { AlertCircle, Target, FileText, Wallet, RefreshCw, Search, Receipt } from "lucide-react";
import DashboardLoading from "@/app/(modules)/loading";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"milestones" | "invoices" | "receipts">("milestones");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, milestoneRes] = await Promise.all([
        getInvoicesAction(),
        getAllMilestonesAction()
      ]);
      
      if (invoiceRes?.success && invoiceRes.data) {
        setInvoices(invoiceRes.data);
      }
      if (milestoneRes?.success && milestoneRes.data) {
        setMilestones(milestoneRes.data);
      }
    } catch (err) {
      console.error("Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <DashboardLoading />;



  // Calculate overdue invoice alerts
  const overdueCount = invoices.filter(
    (inv) => inv.status === "sent" && inv.due_date && new Date(inv.due_date).getTime() < Date.now()
  ).length;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Billing & <span className="text-indigo-600 dark:text-indigo-400">Collections</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage client invoices, monitor milestone collections, and track inbound receivables.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-80 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project, client, or milestone title..."
              className="w-full pl-9 pr-4 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all hover:text-slate-900 dark:hover:text-white active:scale-95 flex-shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs list selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/20 dark:border-white/5 self-start w-fit">
        <button
          onClick={() => setActiveTab("milestones")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center gap-2",
            activeTab === "milestones"
              ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <Target className="w-3.5 h-3.5" />
          Milestone Payments ({milestones.filter((m: any) => m.status !== 'paid').length})
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center gap-2",
            activeTab === "invoices"
              ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          Invoices Ledger ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab("receipts")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center gap-2",
            activeTab === "receipts"
              ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <Receipt className="w-3.5 h-3.5" />
          Payment Receipts ({milestones.filter((m: any) => m.status === 'paid').length + invoices.filter((i: any) => i.status === 'paid').length})
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={cn(overdueCount > 0 ? "lg:col-span-8" : "lg:col-span-12", "space-y-6")}>
          {activeTab === "milestones" && (
            <MilestonePaymentsTable 
              milestones={milestones} 
              onRefresh={fetchData} 
              searchQuery={searchQuery}
            />
          )}
          {activeTab === "invoices" && (
            <InvoiceTable 
              invoices={invoices} 
              searchQuery={searchQuery}
              onRefresh={fetchData}
            />
          )}
          {activeTab === "receipts" && (
            <PaymentReceiptsTable 
              milestones={milestones} 
              invoices={invoices} 
              searchQuery={searchQuery} 
            />
          )}
        </div>

        {/* Sidebar widgets */}
        {overdueCount > 0 && (
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Collections Alert</p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/70 leading-relaxed">
                    {overdueCount} client invoice{overdueCount > 1 ? "s are" : " is"} currently overdue. Follow up with the respective project accountants or freeze project operations if payments are outstanding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
