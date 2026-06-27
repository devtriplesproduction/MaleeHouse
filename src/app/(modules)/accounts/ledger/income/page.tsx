import React from "react";
import { LedgerTable, LedgerItem } from "@/features/accounts/LedgerTable";
import { getInvoicesAction, getPaymentsAction } from "@/actions/finance.actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IncomeLedgerPage() {
  const [invoicesRes, paymentsRes] = await Promise.all([
    getInvoicesAction(),
    getPaymentsAction()
  ]);

  const invoices = invoicesRes.success ? (invoicesRes.data || []) : [];
  const payments = paymentsRes.success ? (paymentsRes.data || []) : [];

  const ledgerData: LedgerItem[] = [];

  // Map Invoices
  invoices.forEach((inv: any) => {
    ledgerData.push({
      id: `inv-${inv.id}`,
      date: inv.created_at,
      project_id: inv.project_id,
      project_name: inv.projects?.name || 'Unknown Project',
      category: 'Invoice',
      description: inv.invoice_number || 'Unknown Invoice',
      amount: Number(inv.total_amount || inv.amount || 0),
      status: inv.status || 'pending',
      source: 'invoice'
    });
  });

  // Map Payments
  payments.forEach((pay: any) => {
    ledgerData.push({
      id: `pay-${pay.id}`,
      date: pay.payment_date || pay.created_at,
      project_id: pay.project_id,
      project_name: pay.projects?.name || 'Unknown Project',
      category: 'Payment',
      description: pay.transaction_id ? `${pay.payment_method} (${pay.transaction_id})` : pay.payment_method,
      amount: Number(pay.amount || 0),
      status: pay.status || 'completed',
      receipt_url: pay.receipt_url,
      source: 'payment'
    });
  });

  // Fetch unique projects to pass as filter options
  const supabase: any = await createClient();
  const { data: projectsData } = await supabase.from('projects').select('id, name');
  const projects = projectsData || [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Income Ledger
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track all issued invoices and received payments.
        </p>
      </div>

      <LedgerTable data={ledgerData} type="income" projects={projects} />
    </div>
  );
}
