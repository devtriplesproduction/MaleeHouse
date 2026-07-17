"use client";

import { Calculator, Inbox, FileEdit, CheckCircle2, DollarSign, Receipt, Scroll, BarChart2, ShieldAlert, Target, Building2, Megaphone, AlertCircle, FolderKanban, Landmark, Clock, CalendarCheck, PlaneTakeoff } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

import { SidebarLink } from "./BaseSidebar";
import { useUser } from "@/hooks/useUser";

const accountsLinks: SidebarLink[] = [
  // --- Core Accountant Work ---
  { title: "Accounts Overview", href: "/accounts", icon: Calculator },
  {
    title: "Quotation Workflow",
    icon: FileEdit,
    subLinks: [
      { title: "Quote Intake", href: "/accounts/intake", icon: Inbox },
      { title: "Draft Quotations", href: "/accounts/quotations", icon: FileEdit },
      { title: "Client Approvals", href: "/accounts/approvals", icon: CheckCircle2 },
    ]
  },
  { title: "Milestones", href: "/accounts/milestones", icon: Target },
  { title: "Billing & Collections", href: "/accounts/billing", icon: DollarSign },
  { title: "Outstanding Payments", href: "/accounts/outstanding", icon: AlertCircle },
  { title: "All Projects", href: "/projects", icon: FolderKanban },
  {
    title: "General Ledger",
    icon: Scroll,
    subLinks: [
      { title: "Income", href: "/accounts/ledger/income", icon: DollarSign },
      { title: "Expenses", href: "/accounts/ledger/expense", icon: Receipt },
    ]
  },
  { title: "Financial Reports", href: "/accounts/reports", icon: BarChart2 },
  { title: "T&C Templates", href: "/accounts/templates", icon: Scroll },
  // --- Support / Settings ---
  { title: "Audit Logs", href: "/accounts/audit", icon: ShieldAlert },
  {
    title: "Company Settings",
    icon: Building2,
    subLinks: [
      { title: "Company Details", href: "/settings/details", icon: Building2 },
      { title: "Company Accounts", href: "/settings/account", icon: Landmark },
    ]
  },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  // --- Personal / HR ---
  { title: "EOD Reports", href: "/eod", icon: Clock },
  { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Apply Leave", href: "/leaves", icon: PlaneTakeoff },
];

export function AccountsSidebar() {
  const { role } = useUser();
  const filteredLinks = accountsLinks.filter(link => {
    if (link.title === "Audit Logs" && role !== "admin") return false;
    return true;
  });

  return <BaseSidebar links={filteredLinks} />;
}
