'use client';

import React, { useState, useEffect } from 'react';
import { getInvoicesAction, getPaymentsAction, getProjectFinancesAction } from '@/actions/finance.actions';
import { getExpensesAction } from '@/actions/expense.actions';
import { LedgerTable, LedgerItem } from '@/features/accounts/LedgerTable';
import { Activity, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectFinanceDashboardTab({ projectId, theme }: { projectId: string; theme?: any }) {
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState<any>(null);
  const [incomeItems, setIncomeItems] = useState<LedgerItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<LedgerItem[]>([]);
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [finRes, invRes, payRes, expRes] = await Promise.all([
          getProjectFinancesAction(projectId),
          getInvoicesAction(projectId),
          getPaymentsAction(projectId),
          getExpensesAction({ project_id: projectId }) // Assuming it accepts projectId filter
        ]);

        if (finRes.success) setFinances(finRes.data);
        
        // Transform income
        let income: LedgerItem[] = [];
        if (invRes.success && Array.isArray(invRes.data)) {
          income = income.concat(invRes.data.map((inv: any) => ({
            id: inv.id,
            date: inv.created_at,
            project_id: inv.project_id,
            project_name: inv.projects?.name || 'Unknown Project',
            category: 'Invoice',
            description: `Invoice ${inv.invoice_number} - ${inv.notes || ''}`,
            amount: inv.total_amount || inv.amount,
            status: inv.status,
            source: 'invoice'
          })));
        }
        if (payRes.success && Array.isArray(payRes.data)) {
          income = income.concat(payRes.data.map((pay: any) => ({
            id: pay.id,
            date: pay.created_at,
            project_id: pay.project_id,
            project_name: pay.projects?.name || 'Unknown Project',
            category: 'Payment',
            description: `Payment ${pay.reference_id || ''}`,
            amount: pay.amount,
            status: pay.status,
            source: 'payment'
          })));
        }
        setIncomeItems(income);
        
        // Transform expenses
        if (expRes.success && Array.isArray(expRes.data)) {
          setExpenseItems(expRes.data.map((exp: any) => ({
            id: exp.id,
            date: exp.date,
            project_id: exp.project_id,
            project_name: exp.projects?.name || 'Company Expense',
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            status: exp.status,
            added_by: exp.users?.name || exp.added_by,
            receipt_url: exp.receipt_url,
            source: 'expense'
          })));
        }
      } catch (err: any) {
        toast.error('Failed to load project finances');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-8 pb-20 animate-pulse">
        <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-md w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-slate-800 h-32"></div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-slate-800 h-24"></div>
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Calculate totals manually just in case finances is missing or outdated
  const totalIncome = incomeItems.filter(i => i.status === 'paid' || i.status === 'verified').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenseItems.filter(e => e.status !== 'rejected').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const budget = finances?.total_quoted_amount || 0;
  const progressPercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : (totalExpense > 0 ? 100 : 0);
  
  let progressColor = 'bg-emerald-500';
  if (progressPercent > 75) progressColor = 'bg-amber-500';
  if (progressPercent > 90) progressColor = 'bg-red-500';

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Project Finance Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time localized financial overview and ledgers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="glass-card p-6 dark:bg-white/[0.03] group hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden shadow-xl shadow-black/[0.02]">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Income (Paid)</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                {formatCurrency(totalIncome)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-card p-6 dark:bg-white/[0.03] group hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden shadow-xl shadow-black/[0.02]">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all duration-500 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Expenses</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                {formatCurrency(totalExpense)}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="glass-card p-6 dark:bg-white/[0.03] group hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden shadow-xl shadow-black/[0.02]">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Profit</p>
              <h3 className={`text-3xl font-extrabold tracking-tight leading-none ${netProfit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {formatCurrency(netProfit)}
              </h3>
            </div>
            <div className={`p-3 ${theme?.bg || 'bg-indigo-500/10'} rounded-2xl border ${theme?.border || 'border-indigo-500/20'} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              <DollarSign className={`w-5 h-5 ${theme?.text || 'text-indigo-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Budget vs Spend Card */}
      <div className="glass-card p-6 dark:bg-white/[0.03] shadow-xl shadow-black/[0.02] relative overflow-hidden">
        <div className={`absolute -left-10 -bottom-10 w-40 h-40 ${theme?.bg?.replace('bg-', '') || 'indigo-500'}/5 rounded-full blur-3xl pointer-events-none`} />
        <h3 className="relative z-10 text-sm font-bold text-slate-900 dark:text-white mb-4">Budget vs Actual Spend</h3>
        <div className="relative z-10 flex justify-between text-xs text-slate-500 mb-2 font-semibold">
          <span>{formatCurrency(totalExpense)} Spent</span>
          <span>{formatCurrency(budget)} Budget</span>
        </div>
        <div className="relative z-10 w-full bg-slate-100 dark:bg-white/5 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
          <div className={`h-3 rounded-full ${progressColor} transition-all duration-1000 shadow-md`} style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="relative z-10 text-xs text-slate-500 mt-2 font-medium">
          {progressPercent >= 100 ? 'Over budget or matched perfectly.' : `${(100 - progressPercent).toFixed(1)}% of budget remaining.`}
        </p>
      </div>

      <div className="space-y-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Income Ledger</h3>
        </div>
        <LedgerTable data={incomeItems} type="income" projects={[]} />
      </div>

      <div className="space-y-4 pt-8 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Expense Ledger</h3>
        </div>
        <LedgerTable data={expenseItems} type="expense" projects={[]} />
      </div>
    </div>
  );
}
