import React, { Suspense } from "react";

export const dynamic = "force-dynamic";
import { RealtimeStatsGrid } from "@/components/modules/RealtimeStatsGrid";
import { TrendingUp, AlertCircle, FileText, Zap, ChevronDown, IndianRupee, ArrowUpRight, ArrowDownRight, Wallet, Clock, CheckSquare, Target } from "lucide-react";
import Link from "next/link";
import { getQuotationIntakeQueueAction } from "@/actions/quotation.actions";
import { createClient } from "@/lib/supabase/server";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";
import { QuotationIntakeQueue } from "@/features/accounts/QuotationIntakeQueue";
import { UpcomingMilestonesWidget } from "@/features/accounts/UpcomingMilestonesWidget";
import { getAllMilestonesAction, getFinancialOverviewAction, getProjectProfitabilityAction } from "@/actions/finance.actions";
import { ExpenseEntryTrigger } from "@/features/accounts/ExpenseEntryTrigger";
import { FinanceChart } from "@/features/accounts/FinanceChart";
import { getMyEODReportsAction } from "@/actions/eod.actions";
import { EODFormModal } from "@/components/eod/EODFormModal";

export default async function AccountantDashboardPage() {
  const supabase: any = await createClient();
  // Fetch real database queue & quotations
  const [intakeRes, quotationsRes, projectsRes, milestonesRes, overviewRes, profitRes, eodRes] = await Promise.all([
    getQuotationIntakeQueueAction(),
    supabase.from('quotations').select('id, status, created_at, updated_at, total_amount'),
    supabase.from('projects').select('id, status, created_at, deleted_at').is('deleted_at', null),
    getAllMilestonesAction(),
    getFinancialOverviewAction(),
    getProjectProfitabilityAction(),
    getMyEODReportsAction(),
  ]);

  const quotations = quotationsRes.data || [];
  const projects = projectsRes.data || [];
  const milestones = milestonesRes.success ? milestonesRes.data : [];
  
  const overview = overviewRes.success ? overviewRes.data : {
    totalIncome: 0, totalExpenses: 0, monthlyProfit: 0, accountsReceivable: 0, accountsPayable: 0, monthlyCashFlow: [], expenseByCategory: []
  };
  const profitData = profitRes.success ? profitRes.data : [];
  const eodReports = eodRes.success ? eodRes.data : [];

  // Calculate the new KPI metrics
  const monthlyRevenue = overview.totalIncome || 0;
  
  const activeProjects = projects.filter((p: any) => 
    p.status !== 'Completed' && p.status !== 'Archived' && p.status !== 'cancelled' && p.status !== 'completed'
  ).length;

  const pendingQuoteRequests = intakeRes.success && intakeRes.data ? intakeRes.data.length : 0;
  
  const waitingClientApproval = quotations.filter((q: any) => 
    q.status === 'Sent' || q.status === 'Pending Approval' || q.status === 'Review'
  ).length;

  const milestonesPending = milestones.filter((m: any) => 
    m.status !== 'paid' && m.status !== 'completed'
  ).length;

  const outstandingCollections = overview.outstandingPayments || 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Accounts Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Financial KPIs and pipeline at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <EODFormModal reports={eodReports} roleColor="indigo" />
          <ExpenseEntryTrigger projects={projects} />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 !mt-5">
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Monthly Revenue
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              ₹{(monthlyRevenue / 100000).toFixed(1)}L
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Active Projects
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {activeProjects}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Pending Quotes
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {pendingQuoteRequests}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Awaiting Approval
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {waitingClientApproval}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Milestones Pending
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {milestonesPending}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Outstanding
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              ₹{(outstandingCollections / 100000).toFixed(1)}L
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column for summary grids */}
        <div className="xl:col-span-2 space-y-6">


          {/* Recent Quotations Row */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800 dark:text-white" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quotation Intake Queue</h2>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/accounts/intake" className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View All</Link>
              </div>
            </div>
            
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
              <QuotationIntakeQueue projects={intakeRes.data || []} hideSearch={true} />
            </div>
          </div>

          <UpcomingMilestonesWidget milestones={milestones} />
        </div>

        {/* Right column for Notifications */}
        <div className="space-y-6 h-full">
          <DashboardNotificationCenter />
        </div>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinanceChart type="income-vs-expense" title="Income vs Expense" subtitle="Monthly comparative overview" data={overview.monthlyCashFlow} />
        <FinanceChart type="cash-flow" title="Net Cash Flow" subtitle="Monthly net positive/negative cash flow" data={overview.monthlyCashFlow} />
        <FinanceChart type="revenue-trend" title="Revenue Trend" subtitle="Monthly gross revenue tracking" data={overview.monthlyCashFlow} />
        <FinanceChart type="profit-trend" title="Profit Trend" subtitle="Monthly net profit tracking" data={overview.monthlyCashFlow} />
        <FinanceChart type="expense-categories" title="Expense Categories" subtitle="Distribution of expenses by category" data={overview.expenseByCategory} />
        <FinanceChart type="project-profitability" title="Project Profitability" subtitle="Top 10 projects by margin" data={profitData} />
      </div>
    </div>
  );
}
