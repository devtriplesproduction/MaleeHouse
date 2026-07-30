import React from "react";
import { getLedgerWorkspaceDataAction } from "@/actions/finance.actions";
import { LedgerItem } from "@/features/accounts/LedgerTable";
import { LedgerWorkspace } from "@/features/accounts/LedgerWorkspace";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const ledgerDataRes = await getLedgerWorkspaceDataAction();
  const data = ledgerDataRes.success ? ledgerDataRes.data : {};
  
  const projects = data?.projects || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const expenses = data?.expenses || [];
  const visitsData = data?.visits || [];
  const payrollData = data?.payroll || [];

  // --- Income data (mirrors /ledger/income logic exactly) ---
  const incomeData: LedgerItem[] = [];

  invoices.forEach((inv: any) => {
    if (inv.status === 'paid') return; // Hide paid invoices to avoid duplicating with the actual payment record
    incomeData.push({
      id: `inv-${inv.id}`,
      date: inv.created_at,
      project_id: inv.project_id,
      project_name: inv.projects?.name || "Unknown Project",
      category: "Invoice",
      description: inv.invoice_number || "Unknown Invoice",
      amount: Number(inv.total_amount || inv.amount || 0),
      status: inv.status || "pending",
      source: "invoice",
    });
  });

  payments.forEach((pay: any) => {
    incomeData.push({
      id: `pay-${pay.id}`,
      date: pay.payment_date || pay.created_at,
      project_id: pay.project_id,
      project_name: pay.projects?.name || "Unknown Project",
      category: "Payment",
      description: pay.transaction_id
        ? `${pay.payment_method} (${pay.transaction_id})`
        : pay.payment_method,
      amount: Number(pay.amount || 0),
      status: pay.status || "completed",
      receipt_url: pay.receipt_url,
      source: "payment",
      bank_name: pay.bank_accounts?.bank_name || undefined,
    });
  });

  // --- Expense data (mirrors /ledger/expense logic exactly) ---
  const expenseData: LedgerItem[] = [];

  expenses.forEach((exp: any) => {
    const creator = exp.profiles || exp.created_by_profile;
    const addedByName = creator
      ? `${creator.first_name} ${creator.last_name}`.trim()
      : "Unknown User";
    expenseData.push({
      id: `exp-${exp.id}`,
      date: exp.expense_date,
      project_id: exp.project_id || "company-wide",
      project_name: exp.project_id
        ? exp.projects?.name || "Unknown Project"
        : "Company-wide",
      category: exp.category,
      description: exp.description,
      amount: Number(exp.amount || 0),
      status: exp.status || "paid",
      added_by: addedByName,
      receipt_url: exp.receipt_url,
      source: "expense",
      bank_name: exp.bank_accounts?.bank_name || undefined,
    });
  });


  (payrollData || []).forEach((cycle: any) => {
    const totalAmount = (cycle.payroll_snapshots || []).reduce((sum: number, snap: any) => sum + Number(snap.net_payable || 0), 0);
    if (totalAmount > 0) {
      expenseData.push({
        id: `payroll-${cycle.id}`,
        date: cycle.created_at,
        project_id: "company-wide",
        project_name: "Company-wide",
        category: "Payroll Processing",
        description: `Payroll Cycle - ${cycle.month}/${cycle.year}`,
        amount: totalAmount,
        status: "paid",
        added_by: "System",
        source: "expense",
        bank_name: cycle.bank_accounts?.bank_name || undefined,
      });
    }
  });

  (visitsData || []).forEach((visit: any) => {

    const amt = Number(visit.visit_cost || 0);
    if (amt > 0) {
      expenseData.push({
        id: `visit-${visit.id}`,
        date: visit.scheduled_date || visit.created_at,
        project_id: visit.project_id,
        project_name: visit.projects?.name || "Unknown Project",
        category: "Field Visit",
        description: visit.purpose || "Field Visit",
        amount: amt,
        status:
          visit.status === "completed"
            ? "paid"
            : visit.status === "cancelled"
            ? "cancelled"
            : "pending",
        added_by: "System",
        source: "expense",
      });
    }
  });

  return (
    <LedgerWorkspace
      incomeData={incomeData}
      expenseData={expenseData}
      projects={projects}
    />
  );
}
