"use client";

import React, { useState, useEffect } from "react";
import { getInvoicesAction, getAllMilestonesAction, getProjectBillingSummaryAction } from "@/actions/finance.actions";
import { InvoiceTable } from "@/features/accounts/InvoiceTable";
import { MilestonePaymentsTable } from "@/features/accounts/MilestonePaymentsTable";
import { PaymentReceiptsTable } from "@/features/accounts/PaymentReceiptsTable";
import { ProjectBillingTable, ProjectBillingSummary } from "@/features/accounts/ProjectBillingTable";
import { ExpenseEntryTrigger } from "@/features/accounts/ExpenseEntryTrigger";
import { AlertCircle, Target, FileText, Wallet, RefreshCw, Search, Receipt, Briefcase } from "lucide-react";
import DashboardLoading from "@/app/(modules)/loading";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [projectsData, setProjectsData] = useState<ProjectBillingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "milestones" | "invoices" | "receipts">("projects");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, milestoneRes, projectRes] = await Promise.all([
        getInvoicesAction(),
        getAllMilestonesAction(),
        getProjectBillingSummaryAction()
      ]);
      
      if (invoiceRes?.success && invoiceRes.data) {
        setInvoices(invoiceRes.data);
      }
      if (milestoneRes?.success && milestoneRes.data) {
        setMilestones(milestoneRes.data);
      }
      if (projectRes?.success && projectRes.data) {
        setProjectsData(projectRes.data);
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

          <ExpenseEntryTrigger projects={projectsData} />
        </div>
      </div>

      {/* Tabs list selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/20 dark:border-white/5 self-start w-fit">
        <button
          onClick={() => setActiveTab("projects")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center gap-2",
            activeTab === "projects"
              ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Projects View ({projectsData.length})
        </button>
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
        <div className="lg:col-span-12 space-y-6">
          {activeTab === "projects" && (
            <ProjectBillingTable 
              projects={projectsData} 
              onRefresh={fetchData} 
              searchQuery={searchQuery}
            />
          )}
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


      </div>
    </div>
  );
}
