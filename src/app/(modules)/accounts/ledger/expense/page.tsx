import React from "react";
import { LedgerTable, LedgerItem } from "@/features/accounts/LedgerTable";
import { getExpensesAction } from "@/actions/expense.actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpenseLedgerPage() {
  const expensesRes = await getExpensesAction();
  const expenses = expensesRes.success ? (expensesRes.data || []) : [];

  const ledgerData: LedgerItem[] = [];

  // Map Expenses
  expenses.forEach((exp: any) => {
    const creator = exp.profiles || exp.created_by_profile; // Checking fallback just in case
    const addedByName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : 'Unknown User';

    ledgerData.push({
      id: `exp-${exp.id}`,
      date: exp.expense_date,
      project_id: exp.project_id || 'company-wide',
      project_name: exp.project_id ? (exp.projects?.name || 'Unknown Project') : 'Company-wide',
      category: exp.category,
      description: exp.description,
      amount: Number(exp.amount || 0),
      status: exp.status || 'paid',
      added_by: addedByName,
      receipt_url: exp.receipt_url,
      source: 'expense'
    });
  });

  const supabase: any = await createClient();
  const { data: visitsData } = await supabase
    .from('project_visits')
    .select('*, projects(name)');

  if (visitsData) {
    visitsData.forEach((visit: any) => {
      const amt = Number(visit.visit_cost || 0);
      if (amt > 0) {
        ledgerData.push({
          id: `visit-${visit.id}`,
          date: visit.scheduled_date || visit.created_at,
          project_id: visit.project_id,
          project_name: visit.projects?.name || 'Unknown Project',
          category: 'Field Visit',
          description: visit.purpose || 'Field Visit',
          amount: amt,
          status: visit.status === 'completed' ? 'paid' : (visit.status === 'cancelled' ? 'cancelled' : 'pending'),
          added_by: 'System',
          source: 'expense'
        });
      }
    });
  }

  // Fetch unique projects to pass as filter options
  const { data: projectsData } = await supabase.from('projects').select('id, name');
  const projects = projectsData || [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Expense Ledger
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track all logged expenses and overheads.
        </p>
      </div>

      <LedgerTable data={ledgerData} type="expense" projects={projects} />
    </div>
  );
}
