'use client';

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileText, FileSpreadsheet, Calendar, ChevronDown, CheckCircle2, Loader2, Download, User, Briefcase, TrendingUp, TrendingDown, Wallet, FileBarChart2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, subMonths, subWeeks } from 'date-fns';
import { 
  getProfitLossReportAction, 
  getIncomeStatementAction, 
  getExpenseStatementAction, 
  getCashFlowStatementAction, 
  getBalanceSheetAction,
  getProjectStatementAction,
  getAllProjectSummaryAction,
  getProjectBudgetSheetAction,
  getExpensesFundAllocationAction,
  getProjectActualSheetAction
} from '@/actions/reports.actions';
import { getProjectsListAction } from '@/actions/project.actions';
import { generateFinancialReportPDF } from '@/lib/financial-pdf-generator';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

type ReportType = 'profit_loss' | 'income' | 'expense' | 'cash_flow' | 'balance_sheet' | 'project_statement' | 'all_project_summary' | 'project_budget_sheet' | 'expenses_fund_allocation' | 'project_actual_sheet';
type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

export function ReportsGenerator() {
  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [generatedConfig, setGeneratedConfig] = useState<{type: ReportType, from: string, to: string, projectId?: string} | null>(null);

  useEffect(() => {
    async function loadProjects() {
      const res = await getProjectsListAction();
      if (res.success && res.data) {
        setProjects(res.data);
      }
    }
    loadProjects();
  }, []);

  const handleDatePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case 'today':
        setDateFrom(format(startOfDay(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setDateFrom(format(startOfDay(yesterday), 'yyyy-MM-dd'));
        setDateTo(format(endOfDay(yesterday), 'yyyy-MM-dd'));
        break;
      case 'this_week':
        setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'last_week':
        const lastWeek = subWeeks(now, 1);
        setDateFrom(format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setDateTo(format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'this_month':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
    }
  };

  const handleGenerate = async () => {
    if (['project_statement', 'project_budget_sheet', 'project_actual_sheet'].includes(reportType) && !selectedProjectId) {
      toast.error('Project Required', { description: 'Please select a specific project for this report.' });
      return;
    }
    if (!['project_statement', 'project_budget_sheet', 'project_actual_sheet'].includes(reportType) && (!dateTo || (reportType !== 'balance_sheet' && !dateFrom))) {
      toast.error('Invalid Date', { description: 'Please select a valid date range.' });
      return;
    }
    setIsLoading(true);
    setReportData(null);
    try {
      let res;
      const pid = selectedProjectId || undefined;
      switch (reportType) {
        case 'profit_loss':
          res = await getProfitLossReportAction(dateFrom, dateTo, pid);
          break;
        case 'income':
          res = await getIncomeStatementAction(dateFrom, dateTo, pid);
          break;
        case 'expense':
          res = await getExpenseStatementAction(dateFrom, dateTo, pid);
          break;
        case 'cash_flow':
          res = await getCashFlowStatementAction(dateFrom, dateTo, pid);
          break;
        case 'balance_sheet':
          res = await getBalanceSheetAction(dateTo, pid);
          break;
        case 'project_statement':
          if (!pid) { toast.error('Project Required', { description: 'Please select a specific project.' }); setIsLoading(false); return; }
          res = await getProjectStatementAction(pid);
          break;
        case 'all_project_summary':
          res = await getAllProjectSummaryAction(dateFrom, dateTo);
          break;
        case 'project_budget_sheet':
          if (!pid) { toast.error('Project Required', { description: 'Please select a specific project for the Budget Sheet.' }); setIsLoading(false); return; }
          res = await getProjectBudgetSheetAction(pid);
          break;
        case 'expenses_fund_allocation':
          res = await getExpensesFundAllocationAction(dateFrom, dateTo);
          break;
        case 'project_actual_sheet':
          if (!pid) { toast.error('Project Required', { description: 'Please select a specific project for the Actual Sheet.' }); setIsLoading(false); return; }
          res = await getProjectActualSheetAction(pid);
          break;
      }
      
      if (res?.success) {
        setReportData(res.data);
        setGeneratedConfig({ type: reportType, from: dateFrom, to: dateTo, projectId: pid });
      } else {
        toast.error('Failed to generate report', { description: res?.error || 'Unknown error' });
      }
    } catch (e: any) {
      toast.error('Exception occurred', { description: e?.message || 'Unknown exception' });
    } finally {
      setIsLoading(false);
    }
  };

  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case 'profit_loss': return 'Profit & Loss Statement';
      case 'income': return 'Income Statement';
      case 'expense': return 'Expense Statement';
      case 'cash_flow': return 'Cash Flow Statement';
      case 'balance_sheet': return 'Balance Sheet';
      case 'project_statement': return 'Project Statement (Client Copy)';
      case 'all_project_summary': return 'All Project Summary';
      case 'project_budget_sheet': return 'Project Budget Sheet';
      case 'expenses_fund_allocation': return 'Total Expences Fund Allocation';
      case 'project_actual_sheet': return 'Project Actual Sheet';
      default: return 'Financial Report';
    }
  };

  const exportPDF = () => {
    if (!reportData || !generatedConfig) return;
    const title = getReportTitle(generatedConfig.type);
    
    // We already fetch company and project data in the report actions
    const companySettings = reportData.company || {};
    let currentProject = reportData.project;

    // Fallback if not populated
    if (generatedConfig.projectId && !currentProject) {
      currentProject = projects.find(p => p.id === generatedConfig.projectId) || { client_name: 'Client', client_address: 'Address Not Provided', client_contact: '' };
    }

    generateFinancialReportPDF(reportData, generatedConfig as any, companySettings, currentProject, title);
  };

  const exportExcel = () => {
    if (!reportData || !generatedConfig) return;

    const wb = XLSX.utils.book_new();
    
    if (generatedConfig.type === 'profit_loss' || generatedConfig.type === 'cash_flow') {
      const revData = Object.entries(reportData.revenueByProject || {}).map(([k, v]) => ({ 'Project': k, 'Amount': v }));
      revData.push({ 'Project': 'Total Revenue', 'Amount': reportData.totalRevenue });
      const wsRev = XLSX.utils.json_to_sheet(revData);
      XLSX.utils.book_append_sheet(wb, wsRev, "Revenue");

      const costData = Object.entries(reportData.costsByCategory || {}).map(([k, v]) => ({ 'Category': k, 'Amount': v }));
      costData.push({ 'Category': 'Total Costs', 'Amount': reportData.totalCosts });
      const wsCost = XLSX.utils.json_to_sheet(costData);
      XLSX.utils.book_append_sheet(wb, wsCost, "Costs");

      const summaryData = [{ 'Metric': 'Net Profit', 'Value': reportData.netProfit }];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    } else if (generatedConfig.type === 'income') {
      const data = Object.entries(reportData.incomeByProject || {}).map(([k, v]) => ({ 'Project': k, 'Amount': v }));
      data.push({ 'Project': 'Total Income', 'Amount': reportData.totalIncome });
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Income");

    } else if (generatedConfig.type === 'expense') {
      const data = Object.entries(reportData.expensesByCategory || {}).map(([k, v]) => ({ 'Category': k, 'Amount': v }));
      data.push({ 'Category': 'Total Expenses', 'Amount': reportData.totalExpenses });
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    } else if (generatedConfig.type === 'balance_sheet') {
      const assetData = Object.entries(reportData.assets || {}).map(([k, v]) => ({ 'Asset': k, 'Amount': v }));
      assetData.push({ 'Asset': 'Total Assets', 'Amount': reportData.totalAssets });
      const wsAssets = XLSX.utils.json_to_sheet(assetData);
      XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

      const liabData = Object.entries(reportData.liabilities || {}).map(([k, v]) => ({ 'Liability': k, 'Amount': v }));
      liabData.push({ 'Liability': 'Total Liabilities', 'Amount': reportData.totalLiabilities });
      const wsLiab = XLSX.utils.json_to_sheet(liabData);
      XLSX.utils.book_append_sheet(wb, wsLiab, "Liabilities");

      const summaryData = [{ 'Metric': 'Total Equity', 'Value': reportData.equity }];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    }

    XLSX.writeFile(wb, `${generatedConfig.type}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const renderTableData = () => {
    if (!reportData || !generatedConfig) return null;
    const type = generatedConfig.type;
    
    const isCashFlow = type === 'cash_flow';
    const inflowTitle = isCashFlow ? '1. CASH INFLOW (REVENUE)' : '1. REVENUE';
    const outflowTitle = isCashFlow ? '2. CASH OUTFLOW (EXPENSES)' : '2. COSTS & EXPENSES';
    const summaryTitle = isCashFlow ? '3. CASH FLOW SUMMARY' : '3. PROFIT & LOSS SUMMARY';
    const overviewTitle = isCashFlow ? '4. CASH FLOW OVERVIEW' : '4. FINANCIAL OVERVIEW';
    const totalInflowLabel = isCashFlow ? 'TOTAL CASH INFLOW' : 'TOTAL REVENUE';
    const totalOutflowLabel = isCashFlow ? 'TOTAL CASH OUTFLOW' : 'TOTAL COSTS';
    const netLabel = isCashFlow ? 'NET CASH FLOW' : 'NET PROFIT';

    const UniversalHeader = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2 px-6">
        {/* Client Details */}
        <div className="bg-slate-50 dark:bg-[#0f172a]/50 border border-slate-200/60 dark:border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <User size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-4 uppercase tracking-wider">Client Details</h4>
              <table className="w-full text-xs sm:text-sm">
                <tbody>
                  <tr><td className="py-1.5 text-slate-500 w-24 sm:w-28 font-medium">Client Name</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: {reportData.project?.client_name || 'N/A'}</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium align-top">Address</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: {reportData.project?.client_address || (generatedConfig.projectId ? 'Address Not Provided' : 'N/A')}</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium">Phone</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: {reportData.project?.client_contact || (generatedConfig.projectId ? '' : 'N/A')}</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium">Email</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: {reportData.project?.client_email || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-slate-50 dark:bg-[#0f172a]/50 border border-slate-200/60 dark:border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Briefcase size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-4 uppercase tracking-wider">Project Details</h4>
              <table className="w-full text-xs sm:text-sm">
                <tbody>
                  <tr><td className="py-1.5 text-slate-500 w-24 sm:w-28 font-medium">Project Name</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: {reportData.project?.name || 'All Projects'}</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium">Manager</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: Malee House Team</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium">Status</td><td className="py-1.5 font-semibold text-emerald-600 dark:text-emerald-400">: {reportData.project?.status || 'Completed'}</td></tr>
                  <tr><td className="py-1.5 text-slate-500 font-medium">Currency</td><td className="py-1.5 font-semibold text-slate-800 dark:text-foreground">: INR</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );

    if (type === 'profit_loss' || type === 'cash_flow') {
      return (
        <div className="space-y-8 pb-10">
          {UniversalHeader}
          
          {/* Revenue / Inflow */}
          <div className="px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-500/30">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-blue-600 uppercase tracking-wide">{inflowTitle}</h3>
            </div>
            <div className="border border-blue-200 dark:border-blue-900 rounded-xl overflow-hidden bg-white dark:bg-[#0f172a]/80 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider w-16 text-center">#</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">Description</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.revenueByProject || {}).map(([k, v], idx) => (
                    <tr key={idx} className="border-b border-blue-100 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3 px-6 text-sm text-slate-800 dark:text-foreground font-medium">{k}</td>
                      <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-800 dark:text-foreground">{formatCurrency(v as number)}</td>
                    </tr>
                  ))}
                  {Object.keys(reportData.revenueByProject || {}).length === 0 && (
                    <tr className="border-b border-blue-100 dark:border-blue-900/50">
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 text-center">1</td>
                      <td className="py-3 px-6 text-sm text-slate-800 dark:text-foreground font-medium">Other Income</td>
                      <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-800 dark:text-foreground">₹ 0.00</td>
                    </tr>
                  )}
                  <tr className="bg-blue-50/80 dark:bg-blue-900/20">
                    <td colSpan={2} className="py-4 px-6 text-sm text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">{totalInflowLabel}</td>
                    <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-blue-700 dark:text-blue-400">{formatCurrency(reportData.totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Costs / Outflow */}
          <div className="px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-600 text-white p-2 rounded-full shadow-lg shadow-purple-500/30">
                <TrendingDown size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-purple-600 uppercase tracking-wide">{outflowTitle}</h3>
            </div>
            <div className="border border-purple-200 dark:border-purple-900 rounded-xl overflow-hidden bg-white dark:bg-[#0f172a]/80 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-600 text-white">
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider w-16 text-center">#</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">Description</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.costsByCategory || {}).map(([k, v], idx) => (
                    <tr key={idx} className="border-b border-purple-100 dark:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3 px-6 text-sm text-slate-800 dark:text-foreground font-medium capitalize">{k}</td>
                      <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-800 dark:text-foreground">{formatCurrency(v as number)}</td>
                    </tr>
                  ))}
                  {Object.keys(reportData.costsByCategory || {}).length === 0 && (
                    <tr className="border-b border-purple-100 dark:border-purple-900/50">
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 text-center">1</td>
                      <td className="py-3 px-6 text-sm text-slate-800 dark:text-foreground font-medium">Other Expenses</td>
                      <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-800 dark:text-foreground">₹ 0.00</td>
                    </tr>
                  )}
                  <tr className="bg-purple-50/80 dark:bg-purple-900/20">
                    <td colSpan={2} className="py-4 px-6 text-sm text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">{totalOutflowLabel}</td>
                    <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-purple-700 dark:text-purple-400">{formatCurrency(reportData.totalCosts)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-600 text-white p-2 rounded-full shadow-lg shadow-primary/20">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-teal-600 uppercase tracking-wide">{summaryTitle}</h3>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0f172a]/80 shadow-sm">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 font-medium">Opening Balance</td>
                    <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-slate-800 dark:text-foreground">₹ 0.00</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-sm text-emerald-600 dark:text-emerald-500 font-medium">{totalInflowLabel}</td>
                    <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-emerald-600 dark:text-emerald-500">{formatCurrency(reportData.totalRevenue)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-sm text-rose-600 dark:text-rose-500 font-medium">{totalOutflowLabel}</td>
                    <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-rose-600 dark:text-rose-500">- {formatCurrency(reportData.totalCosts)}</td>
                  </tr>
                  <tr className="bg-teal-50/50 dark:bg-teal-900/10 border-t-2 border-slate-100 dark:border-slate-800">
                    <td className="py-5 px-6 text-sm text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">Closing Balance</td>
                    <td className="py-5 px-6 text-sm font-bold tabular-nums text-right text-teal-700 dark:text-teal-400">{formatCurrency(reportData.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Overview Block */}
          <div className="px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-primary/20">
                <FileBarChart2 size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-indigo-600 uppercase tracking-wide">{overviewTitle}</h3>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0f172a]/80 shadow-sm flex flex-col md:flex-row">
              <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue (Inflow)</span>
                  <span className="text-sm font-bold tabular-nums text-emerald-600">{formatCurrency(reportData.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expenses (Outflow)</span>
                  <span className="text-sm font-bold tabular-nums text-rose-600">{formatCurrency(reportData.totalCosts)}</span>
                </div>
              </div>
              <div className="flex-1 p-8 bg-slate-50 dark:bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">{netLabel}</span>
                <span className={`text-4xl font-black tabular-nums tracking-tight ${reportData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {reportData.netProfit < 0 ? '- ' : ''}{formatCurrency(Math.abs(reportData.netProfit))}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="px-6 mt-16 flex justify-between items-end pb-8">
            <div className="text-center w-48">
              <div className="border-b border-slate-300 dark:border-slate-700 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-foreground">Prepared By</span>
              </div>
              <span className="text-xs text-slate-500">Malee House Team</span>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-300 dark:border-slate-700 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-foreground">Approved By</span>
              </div>
              <span className="text-xs text-slate-500">Authorized Signatory</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'balance_sheet') {
      return (
        <div className="space-y-6">
          {UniversalHeader}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6">Assets</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                {Object.entries(reportData.assets || {}).map(([k, v], idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-foreground font-medium">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-border">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-bold">Total Assets</td>
                  <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6 mt-6">Liabilities</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                {Object.entries(reportData.liabilities || {}).map(([k, v], idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-foreground font-medium capitalize">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-border">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-bold">Total Liabilities</td>
                  <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-rose-600 dark:text-rose-400">{formatCurrency(reportData.totalLiabilities)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-6 py-5 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-between border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-base font-bold text-indigo-900 dark:text-indigo-100">Total Equity</span>
            <span className="text-xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatCurrency(reportData.equity)}
            </span>
          </div>
        </div>
      );
    }
    
    if (type === 'project_statement') {
      return (
        <div className="space-y-6">
          {UniversalHeader}
          
          <div className="mt-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6">Payment Timeline</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-y border-slate-200/60 dark:border-border">
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Milestone</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Due Date</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData.timeline || []).map((t: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-6 text-sm text-slate-900 dark:text-foreground font-medium">{t.title}</td>
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(t.total_amount)}</td>
                      <td className="py-3 px-6 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="px-6 py-5 grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-white/[0.02]">
            <div>
              <p className="text-xs font-bold text-slate-500">Total Billed</p>
              <p className="text-lg font-bold text-slate-900 dark:text-foreground">{formatCurrency(reportData.summary?.totalBilled || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Paid</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.summary?.totalPaid || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Outstanding</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(reportData.summary?.outstanding || 0)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'income') {
      return (
        <div className="space-y-6">
          {UniversalHeader}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Project</th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.incomeTransactions || []).map((t: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-medium">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-medium">{t.project}</td>
                    <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-t-2 border-slate-200 dark:border-border">
                  <td colSpan={2} className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-bold">Total Income</td>
                  <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    if (type === 'all_project_summary') {
      return (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">SR NO</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Project ID</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Quotation No</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Project/Client Name</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Contact No</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Service Type</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Location</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total Invoice Value</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Budget Expenses</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total Expenses</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total Received</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total Pending</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.projects || []).map((p: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground font-medium">{idx + 1}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{p.projectId}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{p.quotationNo}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{p.projectName}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground whitespace-nowrap">{p.contactNo}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{p.serviceType}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{p.location}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{p.totalInvoiceValue}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{p.budgetExpences}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{p.totalExpences}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-emerald-600 dark:text-emerald-400">{p.totalReceived}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-rose-600 dark:text-rose-400">{p.totalPending}</td>
                    <td className="py-4 px-4 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{p.totalProfitLoss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    if (type === 'project_budget_sheet') {
      return (
        <div className="space-y-6">
          {UniversalHeader}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Sr No</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Particulars</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Qty</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Rate</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Days</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.budgetDetails || {}).map(([section, items]: [string, any], sectionIdx: number) => (
                  <React.Fragment key={`section-${sectionIdx}`}>
                    <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                      <td colSpan={6} className="py-2 px-4 text-sm font-bold text-indigo-700 dark:text-indigo-400">{section}</td>
                    </tr>
                    {items.map((item: any, itemIdx: number) => (
                      <tr key={`item-${sectionIdx}-${itemIdx}`} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-foreground">{itemIdx + 1}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-foreground">{item.particulars}</td>
                        <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{item.qty}</td>
                        <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{item.rate}</td>
                        <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{item.days}</td>
                        <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{item.amount}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b-2 border-slate-200 dark:border-slate-800">
                      <td colSpan={5} className="py-3 px-4 text-sm text-slate-900 dark:text-foreground font-bold text-right">Total {section}</td>
                      <td className="py-3 px-4 text-sm font-bold tabular-nums text-right text-indigo-600 dark:text-indigo-400">{reportData.sectionTotals?.[section] || 0}</td>
                    </tr>
                  </React.Fragment>
                ))}
                <tr className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                  <td colSpan={5} className="py-3 px-4 text-sm font-bold text-right text-slate-900 dark:text-foreground">Total Quotation Value</td>
                  <td className="py-3 px-4 text-sm font-bold tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.totalQuotationValue || 0}</td>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                  <td colSpan={5} className="py-3 px-4 text-sm font-bold text-right text-slate-900 dark:text-foreground">Total Project Costing</td>
                  <td className="py-3 px-4 text-sm font-bold tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.totalProjectCosting || 0}</td>
                </tr>
                <tr className="border-y-2 border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-white/[0.05]">
                  <td colSpan={5} className="py-3 px-4 text-sm font-black text-right text-slate-900 dark:text-foreground">Net Amount</td>
                  <td className="py-3 px-4 text-sm font-black tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.netAmount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    if (type === 'expenses_fund_allocation') {
      return (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">SR NO</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Bank Name</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Service / Divide</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Day</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Remark</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.fundAllocations || []).map((a: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground font-medium">{idx + 1}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{a.bankName}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{a.serviceDivide}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{a.day}</td>
                    <td className="py-4 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(a.amount)}</td>
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-foreground">{a.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    if (type === 'project_actual_sheet') {
      return (
        <div className="space-y-6">
          {UniversalHeader}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Particulars</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Debit</th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.ledger || []).map((l: any, idx: number) => {
                  const dateStr = l.date ? format(new Date(l.date), 'dd-MM-yyyy') : '-';
                  return (
                    <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-foreground">{dateStr}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-foreground">{l.particulars}</td>
                      <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{l.debit ? l.debit : ''}</td>
                      <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 dark:text-foreground">{l.credit ? l.credit : ''}</td>
                    </tr>
                  );
                })}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                  <td colSpan={2} className="py-3 px-4 text-sm font-bold text-right text-slate-900 dark:text-foreground">Net Profit/Loss</td>
                  <td className="py-3 px-4 text-sm font-bold tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.netProfitLoss}</td>
                  <td className="py-3 px-4"></td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-white/[0.05]">
                  <td colSpan={2} className="py-3 px-4 text-sm font-black text-right text-slate-900 dark:text-foreground">Total</td>
                  <td className="py-3 px-4 text-sm font-black tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.total}</td>
                  <td className="py-3 px-4 text-sm font-black tabular-nums text-right text-slate-900 dark:text-foreground">{reportData.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // Fallback for expense
    const items = reportData.expensesByCategory;
    const total = reportData.totalExpenses;
    
    return (
      <div className="space-y-6">
        {UniversalHeader}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-border">
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Category</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(items || {}).map(([k, v], idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-medium capitalize">{k}</td>
                <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-foreground">{formatCurrency(v as number)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-t-2 border-slate-200 dark:border-border">
              <td className="py-4 px-6 text-sm text-slate-900 dark:text-foreground font-bold">Total Expenses</td>
              <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-rose-600 dark:text-rose-400">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-5 sticky top-4 z-10">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-slate-100 appearance-none cursor-pointer shadow-sm"
            >
              <option value="profit_loss">Profit & Loss Statement</option>
              <option value="income">Income Statement</option>
              <option value="expense">Expense Statement</option>
              <option value="cash_flow">Cash Flow Statement</option>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="project_statement">Project Statement (Client Copy)</option>
              <option disabled>──────────</option>
              <option value="all_project_summary">All Project Summary</option>
              <option value="project_budget_sheet">Project Budget Sheet</option>
              <option value="expenses_fund_allocation">Total Expences Fund Allocation</option>
              <option value="project_actual_sheet">Project Actual Sheet</option>
            </select>

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-slate-100 appearance-none cursor-pointer shadow-sm"
            >
              <option value="">All Projects (Company-wide)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {!['balance_sheet', 'project_statement', 'project_budget_sheet', 'project_actual_sheet'].includes(reportType) && (
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value as DateRangePreset)}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-slate-100 appearance-none cursor-pointer shadow-sm"
              >
                <option value="today">Daily (Today)</option>
                <option value="yesterday">Daily (Yesterday)</option>
                <option value="this_week">Weekly (This Week)</option>
                <option value="last_week">Weekly (Last Week)</option>
                <option value="this_month">Monthly (This Month)</option>
                <option value="last_month">Monthly (Last Month)</option>
                <option value="custom">Custom Date Range</option>
              </select>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!['balance_sheet', 'project_statement', 'project_budget_sheet', 'project_actual_sheet'].includes(reportType) && (
                <>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); }}
                    className="w-full sm:w-36 h-11 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-slate-100 shadow-sm"
                  />
                  <span className="text-slate-400 text-sm font-medium">to</span>
                </>
              )}
              {!['project_statement', 'project_budget_sheet', 'project_actual_sheet'].includes(reportType) && (
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); if (reportType !== 'balance_sheet') setDatePreset('custom'); }}
                  className="w-full sm:w-36 h-11 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-slate-100 shadow-sm"
                />
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full sm:w-auto h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate
            </button>
          </div>

          {/* Exports only visible if report generated */}
          {reportData && generatedConfig && (
            <div className="flex items-center justify-start lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800/60">
              <button
                onClick={exportExcel}
                className="h-11 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Export Excel
              </button>
              <button
                onClick={exportPDF}
                className="h-11 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Output */}
      {reportData && generatedConfig && (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
          
          <div className="p-6 border-b border-slate-100 dark:border-border text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">
              {getReportTitle(generatedConfig.type)}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {generatedConfig.type === 'project_statement' 
                ? 'Client Statement of Account & Payment Timeline'
                : generatedConfig.type === 'project_budget_sheet'
                ? 'Project Budget Sheet Overview'
                : generatedConfig.type === 'project_actual_sheet'
                ? 'Project Actual Revenue vs Expenditure'
                : generatedConfig.type === 'balance_sheet' 
                ? `As of ${format(new Date(generatedConfig.to), 'MMMM d, yyyy')}`
                : `For the period ${format(new Date(generatedConfig.from), 'MMM d, yyyy')} to ${format(new Date(generatedConfig.to), 'MMM d, yyyy')}`
              }
            </p>
            {generatedConfig.projectId && (
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                Project: {projects.find(p => p.id === generatedConfig.projectId)?.name}
              </p>
            )}
          </div>

          <div className="pt-4">
            {renderTableData()}
          </div>
          
        </div>
      )}

      {/* Empty State / Initial state */}
      {!reportData && !isLoading && (
        <EmptyState 
          icon={FileText} 
          message="Select a report type, project, and date range to generate." 
        />
      )}
    </div>
  );
}

