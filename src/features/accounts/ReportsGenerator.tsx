'use client';

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileText, FileSpreadsheet, Calendar, ChevronDown, CheckCircle2, Loader2, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, subMonths, subWeeks } from 'date-fns';
import { 
  getProfitLossReportAction, 
  getIncomeStatementAction, 
  getExpenseStatementAction, 
  getCashFlowStatementAction, 
  getBalanceSheetAction 
} from '@/actions/reports.actions';
import { getProjectsListAction } from '@/actions/project.actions';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

type ReportType = 'profit_loss' | 'income' | 'expense' | 'cash_flow' | 'balance_sheet';
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
      default: return 'Financial Report';
    }
  };

  const exportPDF = () => {
    if (!reportData || !generatedConfig) return;
    const doc = new jsPDF();
    const title = getReportTitle(generatedConfig.type);
    
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (generatedConfig.type === 'balance_sheet') {
      doc.text(`As of: ${format(new Date(generatedConfig.to), 'MMM d, yyyy')}`, 14, 30);
    } else {
      doc.text(`Period: ${format(new Date(generatedConfig.from), 'MMM d, yyyy')} to ${format(new Date(generatedConfig.to), 'MMM d, yyyy')}`, 14, 30);
    }
    
    if (generatedConfig.projectId) {
      const p = projects.find(p => p.id === generatedConfig.projectId);
      if (p) doc.text(`Project: ${p.name}`, 14, 36);
    }

    let yPos = generatedConfig.projectId ? 45 : 40;

    const createTable = (head: string[][], body: any[][], theme: 'striped' | 'grid' | 'plain' = 'striped') => {
      autoTable(doc, {
        startY: yPos,
        head,
        body,
        theme,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    };

    if (generatedConfig.type === 'profit_loss' || generatedConfig.type === 'cash_flow') {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Revenue by Project', 14, yPos);
      yPos += 5;
      
      const revBody = Object.entries(reportData.revenueByProject || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      revBody.push(['Total Revenue', formatCurrency(reportData.totalRevenue)]);
      createTable([['Project', 'Amount']], revBody);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Costs by Category', 14, yPos);
      yPos += 5;
      
      const costBody = Object.entries(reportData.costsByCategory || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      costBody.push(['Total Costs', formatCurrency(reportData.totalCosts)]);
      createTable([['Category', 'Amount']], costBody);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Net Profit: ${formatCurrency(reportData.netProfit)}`, 14, yPos + 5);
      
    } else if (generatedConfig.type === 'income') {
      const body = Object.entries(reportData.incomeByProject || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      body.push(['Total Income', formatCurrency(reportData.totalIncome)]);
      createTable([['Project', 'Amount']], body);
      
    } else if (generatedConfig.type === 'expense') {
      const body = Object.entries(reportData.expensesByCategory || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      body.push(['Total Expenses', formatCurrency(reportData.totalExpenses)]);
      createTable([['Category', 'Amount']], body);
      
    } else if (generatedConfig.type === 'balance_sheet') {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Assets', 14, yPos);
      yPos += 5;
      const assetBody = Object.entries(reportData.assets || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      assetBody.push(['Total Assets', formatCurrency(reportData.totalAssets)]);
      createTable([['Asset', 'Amount']], assetBody);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Liabilities', 14, yPos);
      yPos += 5;
      const liabBody = Object.entries(reportData.liabilities || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
      liabBody.push(['Total Liabilities', formatCurrency(reportData.totalLiabilities)]);
      createTable([['Liability', 'Amount']], liabBody);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Total Equity: ${formatCurrency(reportData.equity)}`, 14, yPos + 5);
    }

    doc.save(`${generatedConfig.type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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

    if (type === 'profit_loss' || type === 'cash_flow') {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6">Revenue</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                {Object.entries(reportData.revenueByProject || {}).map(([k, v], idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-white font-medium">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-white">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-white/10">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-bold">Total Revenue</td>
                  <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6 mt-6">Costs & Expenses</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                {Object.entries(reportData.costsByCategory || {}).map(([k, v], idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-white font-medium capitalize">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-white">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-white/10">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-bold">Total Costs</td>
                  <td className="py-4 px-6 text-sm font-bold tabular-nums text-right text-rose-600 dark:text-rose-400">{formatCurrency(reportData.totalCosts)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-6 py-5 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-between border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-base font-bold text-indigo-900 dark:text-indigo-100">Net Profit</span>
            <span className={`text-xl font-black tabular-nums ${reportData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(reportData.netProfit)}
            </span>
          </div>
        </div>
      );
    }

    if (type === 'balance_sheet') {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-6">Assets</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                {Object.entries(reportData.assets || {}).map(([k, v], idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-white font-medium">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-white">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-white/10">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-bold">Total Assets</td>
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
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-6 text-sm text-slate-900 dark:text-white font-medium capitalize">{k}</td>
                    <td className="py-3 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-white">{formatCurrency(v as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b-2 border-slate-200 dark:border-white/10">
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-bold">Total Liabilities</td>
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

    const items = type === 'income' ? reportData.incomeByProject : reportData.expensesByCategory;
    const total = type === 'income' ? reportData.totalIncome : reportData.totalExpenses;
    
    return (
      <div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/5">
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">{type === 'income' ? 'Project' : 'Category'}</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(items || {}).map(([k, v], idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-medium capitalize">{k}</td>
                <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-slate-900 dark:text-white">{formatCurrency(v as number)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-t-2 border-slate-200 dark:border-white/10">
              <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-bold">Total</td>
              <td className={`py-4 px-6 text-sm font-bold tabular-nums text-right ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col gap-4 sticky top-4 z-10 backdrop-blur-md">
        
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white appearance-none cursor-pointer"
          >
            <option value="profit_loss">Profit & Loss Statement</option>
            <option value="income">Income Statement</option>
            <option value="expense">Expense Statement</option>
            <option value="cash_flow">Cash Flow Statement</option>
            <option value="balance_sheet">Balance Sheet</option>
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white appearance-none cursor-pointer"
          >
            <option value="">All Projects (Company-wide)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {reportType !== 'balance_sheet' && (
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as DateRangePreset)}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white appearance-none cursor-pointer"
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
            {reportType !== 'balance_sheet' && (
              <>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); }}
                  className="w-full sm:w-36 h-11 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white"
                />
                <span className="text-slate-400 text-sm font-medium">to</span>
              </>
            )}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); if (reportType !== 'balance_sheet') setDatePreset('custom'); }}
              className="w-full sm:w-36 h-11 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate
          </button>
        </div>

        {/* Exports only visible if report generated */}
        {reportData && generatedConfig && (
          <div className="flex items-center justify-end gap-3 shrink-0 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={exportExcel}
              className="h-10 px-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              className="h-10 px-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Output */}
      {reportData && generatedConfig && (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
          
          <div className="p-6 border-b border-slate-100 dark:border-white/5 text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {getReportTitle(generatedConfig.type)}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {generatedConfig.type === 'balance_sheet' 
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

