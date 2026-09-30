import React from "react";
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/modules/PageHeader";
import { ShieldAlert, AlertCircle, FileText, Zap, IndianRupee, Clock, Target } from "lucide-react";
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
import { KPICard } from "@/components/modules/KPICard";

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
    q.status === 'Sent' || q.status === 'Viewed' || q.status === 'Revision Requested'
  ).length;

  const milestonesPending = milestones.filter((m: any) => 
    m.status !== 'paid' && m.status !== 'completed'
  ).length;

  const outstandingCollections = overview.outstandingPayments || 0;

  const kpis = [
    { label: "Monthly Revenue", value: `₹${(monthlyRevenue / 100000).toFixed(1)}L`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20", icon: IndianRupee },
    { label: "Active Projects", value: activeProjects, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border border-orange-500/20", icon: Zap },
    { label: "Pending Quotes", value: pendingQuoteRequests, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10 border border-sky-500/20", icon: FileText },
    { label: "Awaiting Approval", value: waitingClientApproval, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20", icon: Clock },
    { label: "Milestones Pending", value: milestonesPending, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10 border border-indigo-500/20", icon: Target },
    { label: "Outstanding", value: `₹${(outstandingCollections / 100000).toFixed(1)}L`, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border border-rose-500/20", icon: AlertCircle },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title="Master Financial Control Center"
        subtitle="Financial KPIs, auditing pipeline and controls at a glance."
        icon={ShieldAlert}
        actions={
          <>
            <EODFormModal reports={eodReports} roleColor="indigo" />
            <ExpenseEntryTrigger projects={projects} />
          </>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 !mt-5">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            bg={kpi.bg}
            className="bg-white dark:bg-white/[0.02] border-slate-200/60 dark:border-white/10"
          />
        ))}
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
