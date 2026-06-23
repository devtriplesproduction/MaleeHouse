"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllQuotationsAction } from "@/actions/quotation.actions";
import { transitionWorkflowAction } from "@/actions/workflow.actions";
import { getMilestonesAction } from "@/actions/finance.actions";
import {
  Clock, Send, CheckCircle2, XCircle, AlertCircle, FileText, Eye,
  Download, ArrowRight, Hammer, TrendingUp, DollarSign, RefreshCw,
  Search, Building, BarChart2, X, Info, Sparkles, ShieldCheck, Phone
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DashboardLoading from "@/app/(modules)/loading";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  Sent: {
    icon: Send,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-100 dark:border-sky-500/20",
    label: "Awaiting Client"
  },
  Viewed: {
    icon: Eye,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-100 dark:border-violet-500/20",
    label: "Viewed by Client"
  },
  "Revision Requested": {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-500/20",
    label: "Revision Requested"
  },
  Approved: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-100 dark:border-emerald-500/20",
    label: "Approved"
  },
  Rejected: {
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-100 dark:border-rose-500/20",
    label: "Rejected"
  },
};

export default function ClientApprovalsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected" | "history">("all");
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  const fetchData = async () => {
    if (quotations.length === 0) setLoading(true);
    const res = await getAllQuotationsAction();
    if (res && res.data) {
      setQuotations(
        res.data.filter((q: any) =>
          ["Sent", "Viewed", "Revision Requested", "Approved", "Rejected"].includes(q.status)
        )
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendToEngineering = async (quotation: any) => {
    setDispatching(quotation.id);
    try {
      // Compulsion: Check if milestones are configured
      const msRes = await getMilestonesAction(quotation.project_id);
      if (!msRes?.success || !msRes.data || msRes.data.length === 0) {
        toast.warning("Milestones not planned yet. Redirecting to Milestone Configurator...", {
          duration: 3000
        });
        setTimeout(() => {
          router.push(`/accounts/milestones?project=${quotation.project_id}&plan=true`);
        }, 1500);
        return;
      }

      const res = await transitionWorkflowAction(
        quotation.project_id,
        "project_created",
        "Quotation approved by client. Project dispatched to Engineering survey department."
      );
      if (res?.success) {
        toast.success("Project sent to Engineering successfully.");
        fetchData();
      } else {
        toast.error(res?.error || "Failed to dispatch to Engineering.");
      }
    } catch {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setDispatching(null);
    }
  };

  const handleDownloadQuotationPDF = async (q: any, proj: any) => {
    const { getCompanySettingsAction } = await import('@/actions/settings.actions');
    const settings = await getCompanySettingsAction();
    generateQuotationPDF(q, proj, settings);
  };

  if (loading) return <DashboardLoading />;

  // Filter logic
  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.project?.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "pending") {
      return q.status === "Sent" || q.status === "Viewed" || q.status === "Revision Requested";
    }
    if (activeTab === "approved") {
      return q.status === "Approved";
    }
    if (activeTab === "rejected") {
      return q.status === "Rejected";
    }
    if (activeTab === "history") {
      return q.status === "Approved" || q.status === "Rejected";
    }
    return true;
  }).sort((a: any, b: any) => {
    if (activeTab === "all") {
      const statusOrder: Record<string, number> = {
        "Sent": 1,
        "Viewed": 2,
        "Revision Requested": 3,
        "Approved": 4,
        "Rejected": 5
      };
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Calculate Metrics
  const pendingQuotes = quotations.filter((q) => q.status === "Sent" || q.status === "Viewed" || q.status === "Revision Requested");
  const approvedQuotes = quotations.filter((q) => q.status === "Approved");
  const totalPendingValue = pendingQuotes.reduce((acc: any, q: any) => acc + (q.total_amount || 0), 0);
  const totalApprovedValue = approvedQuotes.reduce((acc: any, q: any) => acc + (q.total_amount || 0), 0);
  const conversionRate = quotations.length ? Math.round((approvedQuotes.length / quotations.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Accounts Registry
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Client <span className="text-indigo-600 dark:text-indigo-400">Approvals</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {pendingQuotes.length} awaiting response · {approvedQuotes.length} approved quotations
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all hover:text-slate-900 dark:hover:text-white active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">INR</span>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              ₹{totalPendingValue.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
              Awaiting Approval
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Contracts</span>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              ₹{totalApprovedValue.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
              Approved Contracts
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Ratio</span>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {conversionRate}%
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
              Conversion Ratio
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Queue</span>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {quotations.filter((q: any) => q.status === "Revision Requested").length}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
              Revisions Requested
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Navigation & Search Row */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-4">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/20 dark:border-white/5 self-start">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-1.5 text-[10px] font-medium rounded-lg transition-all uppercase tracking-wider",
                activeTab === "all"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              All Records
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "px-3.5 py-1.5 text-[10px] font-medium rounded-lg transition-all uppercase tracking-wider",
                activeTab === "pending"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              Pending Action ({pendingQuotes.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={cn(
                "px-3.5 py-1.5 text-[10px] font-medium rounded-lg transition-all uppercase tracking-wider",
                activeTab === "approved"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              Approved ({approvedQuotes.length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={cn(
                "px-3.5 py-1.5 text-[10px] font-medium rounded-lg transition-all uppercase tracking-wider",
                activeTab === "rejected"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              Rejected ({quotations.filter((q: any) => q.status === "Rejected").length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-3.5 py-1.5 text-[10px] font-medium rounded-lg transition-all uppercase tracking-wider",
                activeTab === "history"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              History
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotation number, client, or project..."
              className="w-full pl-9 pr-4 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* List of Quotes */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/30 dark:bg-white/[0.01]">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No matching client approvals found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((q) => {
                const config = STATUS_CONFIG[q.status] ?? {
                  icon: FileText,
                  color: "text-slate-500",
                  bg: "bg-slate-50 dark:bg-white/5",
                  border: "border-slate-200 dark:border-white/10",
                  label: q.status,
                };

                const Icon = config.icon;
                const isApproved = q.status === "Approved";
                const isDispatching = dispatching === q.id;

                return (
                  <motion.div
                    key={q.id}
                    layoutId={q.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-white dark:bg-white/[0.02] border rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.005]",
                      isApproved
                        ? "border-emerald-500/20 hover:border-emerald-500/35 bg-emerald-500/[0.01]"
                        : "border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                    )}
                  >
                    {/* ── Single standardised row ───────────────────────── */}
                    <div className="flex items-center gap-4">

                      {/* Status icon — fixed 40×40 */}
                      <div className={cn(
                        "shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                        config.bg, config.border, config.color
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Name + meta — flex-1 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.project?.id ? (
                            <button
                              onClick={() => router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`)}
                              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-left truncate leading-tight"
                            >
                              {q.project?.name || "Standalone Assignment"}
                            </button>
                          ) : (
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                              {q.client_details?.project_title || q.client_details?.company_name || "Standalone Quotation"}
                            </span>
                          )}
                          <span className={cn(
                            "shrink-0 text-[8px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded border",
                            config.bg, config.border, config.color
                          )}>
                            {config.label}
                          </span>
                        </div>

                        {/* Sub-line */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {q.project?.client_name || q.client_details?.company_name || "Direct Client"}
                          </span>
                          <span className="text-slate-300 dark:text-white/20 text-[10px]">·</span>
                          <span className="text-[10px] font-mono text-slate-400 tracking-wide">{q.quotation_number}</span>
                        </div>
                      </div>

                      {/* CONTRACT VALUE — fixed 110px */}
                      <div className="shrink-0 w-[110px]">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                          Contract Value
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                          ₹{q.total_amount?.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* RELEASE DATE — fixed 100px */}
                      <div className="shrink-0 w-[100px]">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                          Release Date
                        </p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                          {format(new Date(q.created_at), "MMM d, yyyy")}
                        </p>
                      </div>

                      {/* Actions — shrink-0 */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => setSelectedQuote(q)}
                          title="Preview Itemization"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => handleDownloadQuotationPDF(q, q.project || { client_name: "Client", name: "Project" })}
                          title="Download PDF"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Approved actions */}
                        {isApproved && (() => {
                          const isDispatched = q.project?.status && !["lead", "quotation_requested", "quotation_sent", "payment_pending", "payment_done"].includes(q.project.status);
                          if (isDispatched) {
                            return (
                              <div className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3 animate-pulse" /> Active in Ops
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleSendToEngineering(q)}
                              disabled={isDispatching}
                              className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-60 active:scale-95"
                            >
                              {isDispatching ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Hammer className="w-3 h-3" />
                              )}
                              {isDispatching ? "Dispatching…" : "create MileStones"}
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Consent strip (approved only, when phone/date present) */}
                    {isApproved && (q.client_approver_phone || q.client_approved_at) && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-500/10 flex flex-wrap items-center gap-3">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Client Consent Verified</span>
                        {q.client_approver_phone && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-100 dark:border-white/5">
                            <Phone className="w-3 h-3" /> {q.client_approver_phone}
                          </span>
                        )}
                        {q.client_approved_at && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            Approved {format(new Date(q.client_approved_at), "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );

              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Itemization Preview Modal/Drawer */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuote(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                      Quotation Audit
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">
                      {selectedQuote.quotation_number}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Project: {selectedQuote.project?.name || "Unknown Assignment"}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest block">Client Name</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                      {selectedQuote.project?.client_name || "Direct Client"}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest block">Grand Total</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      ₹{selectedQuote.total_amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Line Items Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    Itemized Pricing Schedule
                  </h4>

                  <div className="border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden bg-white/50 dark:bg-transparent shadow-sm">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/10">
                          <th className="p-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Service / Description</th>
                          <th className="p-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                          <th className="p-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Rate</th>
                          <th className="p-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {(selectedQuote.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-xs text-slate-400 italic text-center">
                              No itemized lines recorded
                            </td>
                          </tr>
                        ) : (
                          selectedQuote.items.map((item: any, i: number) => {
                            const unitPrice = item.unit_price !== undefined ? item.unit_price : (item.default_unit_price !== undefined ? item.default_unit_price : 0);
                            const qty = item.quantity !== undefined ? item.quantity : (item.default_quantity !== undefined ? item.default_quantity : 1);
                            const lineTotal = item.total !== undefined ? item.total : (unitPrice * qty);

                            return (
                              <tr key={i} className="text-xs">
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.service_name || "General Survey Services"}</div>
                                  {item.description && <div className="text-[10px] text-slate-400 mt-0.5">{item.description}</div>}
                                </td>
                                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-center">
                                  {qty}
                                </td>
                                <td className="p-3 nums font-medium text-slate-600 dark:text-slate-400 text-right">
                                  ₹{unitPrice.toLocaleString("en-IN")}
                                </td>
                                <td className="p-3 nums font-semibold text-slate-900 dark:text-white text-right">
                                  ₹{lineTotal.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {/* Financial summary rows at bottom of table */}
                    <div className="bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-200/60 dark:border-white/10 p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Subtotal</span>
                        <span className="nums font-medium text-slate-700 dark:text-slate-300">₹{(selectedQuote.subtotal || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">GST ({selectedQuote.gst_rate || 11}%)</span>
                        <span className="nums font-medium text-slate-700 dark:text-slate-300">₹{(selectedQuote.gst_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/40 dark:border-white/5">
                        <span className="text-slate-900 dark:text-white font-semibold uppercase tracking-wider text-[10px]">Grand Total</span>
                        <span className="nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{(selectedQuote.total_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Margins and Discussion Logs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Audit Margin Analysis
                  </h4>

                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/40 dark:border-white/5">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Markup Notes</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedQuote.internal_notes?.margin_notes || "Standard 15% pricing markup applied"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">Discussion Log</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        {selectedQuote.internal_notes?.pricing_discussions?.[0] || "No pricing discussion logs recorded for this quotation iteration."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF & Dispatch Quick Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-white/5 mt-8">
                <button
                  onClick={() => {
                    handleDownloadQuotationPDF(selectedQuote, selectedQuote.project || { client_name: "Client", name: "Project" });
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Contract
                </button>

                {selectedQuote.status === "Approved" && (
                  (() => {
                    const isDispatched = selectedQuote.project?.status && !["lead", "quotation_requested", "quotation_sent", "payment_pending", "payment_done"].includes(selectedQuote.project.status);

                    if (isDispatched) {
                      return (
                        <div className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner flex items-center justify-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                          Active In Ops
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={() => {
                          handleSendToEngineering(selectedQuote);
                          setSelectedQuote(null);
                        }}
                        disabled={dispatching === selectedQuote.id}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 transition-all active:scale-95"
                      >
                        <Hammer className="w-4 h-4" />
                        Dispatch to Survey Ops
                      </button>
                    );
                  })()
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

