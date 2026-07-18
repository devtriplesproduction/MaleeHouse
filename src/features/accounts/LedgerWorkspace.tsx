'use client';

import React, { useState } from 'react';
import { LedgerTable, LedgerItem } from '@/features/accounts/LedgerTable';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Tab = 'income' | 'expense';

interface LedgerWorkspaceProps {
  incomeData: LedgerItem[];
  expenseData: LedgerItem[];
  projects: { id: string; name: string }[];
}

export function LedgerWorkspace({ incomeData, expenseData, projects }: LedgerWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('income');

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'income', label: 'Income', icon: TrendingUp, count: incomeData.length },
    { key: 'expense', label: 'Expenses', icon: TrendingDown, count: expenseData.length },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ledger</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track all issued invoices, received payments and logged expenses.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              tab === key
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={cn(
              'text-[11px] px-1.5 py-0.5 rounded-md font-bold',
              tab === key
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-200 dark:bg-white/10 text-slate-500'
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <LedgerTable
        data={tab === 'income' ? incomeData : expenseData}
        type={tab}
        projects={projects}
      />
    </div>
  );
}
