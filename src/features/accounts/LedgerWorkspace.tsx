'use client';

import React from 'react';
import { LedgerTable, LedgerItem } from '@/features/accounts/LedgerTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface LedgerWorkspaceProps {
  incomeData: LedgerItem[];
  expenseData: LedgerItem[];
  projects: { id: string; name: string }[];
}

export function LedgerWorkspace({ incomeData, expenseData, projects }: LedgerWorkspaceProps) {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <Tabs defaultValue="income">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ledger <span className="text-indigo-500">Workspace</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track all issued invoices, received payments and logged expenses.
            </p>
          </div>

          <TabsList className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 h-11 p-1 rounded-xl">
            <TabsTrigger value="income" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              Expenses
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="income">
          <LedgerTable data={incomeData} type="income" projects={projects} />
        </TabsContent>
        <TabsContent value="expense">
          <LedgerTable data={expenseData} type="expense" projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
