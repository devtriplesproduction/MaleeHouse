import React from "react";
import { createClient } from "@/lib/supabase/server";
import { OutstandingPaymentsClient } from "@/features/accounts/OutstandingPaymentsClient"; 
import { getAllMilestonesAction, getProjectProfitabilityAction } from "@/actions/finance.actions";

export const dynamic = "force-dynamic";

export default async function OutstandingPaymentsPage() {
  const supabase: any = await createClient();

  const [projectsRes, invoicesRes, expensesRes, milestonesRes, profitRes] = await Promise.all([
    supabase.from("projects").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("expenses").select("*"),
    getAllMilestonesAction(),
    getProjectProfitabilityAction(),
  ]);

  const projects = projectsRes.data || [];
  const invoices = invoicesRes.data || [];
  const expenses = expensesRes.data || [];
  const milestones = milestonesRes.success ? milestonesRes.data : [];
  const profitData = profitRes.success ? profitRes.data : [];

  // Calculate outstanding amounts per project
  const projectSummaries = projects.map((p: any) => {
    // Total Billed (Income)
    const projectInvoices = invoices.filter((i: any) => i.project_id === p.id && i.status !== 'cancelled');
    const totalBilled = projectInvoices.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

    // Total Paid
    const paidInvoices = projectInvoices.filter((i: any) => i.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

    // Outstanding = Billed - Paid
    const outstanding = totalBilled - totalPaid;

    // Total Expenses
    const projectExpenses = expenses.filter((e: any) => e.project_id === p.id);
    const totalExpenses = projectExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    // Profit
    const currentProfit = totalBilled - totalExpenses;

    return {
      ...p,
      totalBilled,
      totalPaid,
      outstanding,
      totalExpenses,
      currentProfit
    };
  });

  // Filter projects that actually have outstanding balances or we can show all active
  const outstandingProjects = projectSummaries.filter((p: any) => p.outstanding > 0 || p.status !== 'completed');

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-500 dark:text-white tracking-tight">
            Master Financial Control Center
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Global view of project P&L, outstanding balances, and cost allocations.
          </p>
        </div>
      </div>

      <OutstandingPaymentsClient initialProjects={outstandingProjects} />
    </div>
  );
}
