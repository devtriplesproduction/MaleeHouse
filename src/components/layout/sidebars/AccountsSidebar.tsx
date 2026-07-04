"use client";

import { Calculator, Inbox, FileEdit, CheckCircle2, DollarSign, Receipt, Scroll, BarChart2, ShieldAlert, Target, Building2, Megaphone, AlertCircle } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

import { SidebarLink } from "./BaseSidebar";

const accountsLinks: SidebarLink[] = [
  { title: "Accounts Overview", href: "/accounts", icon: Calculator },
  {
    title: "Quotations Workflow",
    icon: FileEdit,
    subLinks: [
      { title: "Project Intake Queue", href: "/accounts/intake", icon: Inbox },
      { title: "Quotation Workspace", href: "/accounts/quotations", icon: FileEdit },
      { title: "Client Approvals", href: "/accounts/approvals", icon: CheckCircle2 },
    ]
  },
  {
    title: "General Ledger",
    icon: Scroll,
    subLinks: [
      { title: "Income Ledger", href: "/accounts/ledger/income", icon: DollarSign },
      { title: "Expense Ledger", href: "/accounts/ledger/expense", icon: Receipt },
    ]
  },
  { title: "Project Milestones", href: "/accounts/milestones", icon: Target },
  { title: "Billing & Collections", href: "/accounts/billing", icon: DollarSign },
  { title: "Outstanding Payments", href: "/accounts/outstanding", icon: AlertCircle },
  { title: "T&C Templates", href: "/accounts/templates", icon: Scroll },
  { title: "Financial Reports", href: "/accounts/reports", icon: BarChart2 },
  { title: "Audit Logs", href: "/accounts/audit", icon: ShieldAlert },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Company Settings", href: "/settings", icon: Building2 },
];

export function AccountsSidebar() {
  return <BaseSidebar links={accountsLinks} />;
}
