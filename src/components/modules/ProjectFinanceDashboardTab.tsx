'use client';

import React, { useState, useEffect } from 'react';
import { getInvoicesAction, getPaymentsAction, getProjectFinancesAction } from '@/actions/finance.actions';
import { getExpensesAction } from '@/actions/expense.actions';
import { LedgerTable, LedgerItem } from '@/features/accounts/LedgerTable';
import { Activity, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectFinanceDashboardTab({ projectId }: { projectId: string }) {
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
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Income (Paid)</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Expenses</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpense)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Net Profit</h3>
          </div>
          <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Budget vs Actual Spend</h3>
        <div className="flex justify-between text-xs text-slate-500 mb-2 font-semibold">
          <span>{formatCurrency(totalExpense)} Spent</span>
          <span>{formatCurrency(budget)} Budget</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-3 mb-2 overflow-hidden">
          <div className={`h-3 rounded-full ${progressColor} transition-all duration-1000`} style={{ width: `${progressPercent}%` }}></div>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {progressPercent >= 100 ? 'Over budget or matched perfectly.' : `${(100 - progressPercent).toFixed(1)}% of budget remaining.`}
      </p>
    </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Income Ledger</h3>
        <LedgerTable data={incomeItems} type="income" projects={[]} />
      </div>

      <div className="space-y-4 pt-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expense Ledger</h3>
        <LedgerTable data={expenseItems} type="expense" projects={[]} />
      </div>
    </div>
  );
}
