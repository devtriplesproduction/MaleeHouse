"use client";

import { 
  Home, 
  FileText, 
  Inbox, 
  FileEdit, 
  CheckCircle2, 
  Scroll, 
  Users, 
  Megaphone, 
  Clock, 
  CalendarCheck, 
  PlaneTakeoff, 
  FolderKanban, 
  Target, 
  DollarSign, 
  Landmark, 
  Receipt, 
  AlertCircle, 
  Scale, 
  BarChart2, 
  Settings, 
  Building2, 
  ShieldAlert
} from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";
import { SidebarLink } from "./BaseSidebar";
import { useUser } from "@/hooks/useUser";

export function AccountsSidebar() {
  const { role } = useUser();

  const links: SidebarLink[] = [
    { title: "Dashboard", href: "/accounts", icon: Home },
    
    { title: "Divider 1", isSeparator: true },

    {
      title: "Quotations",
      icon: FileText,
      subLinks: [
        { title: "Quote Intake", href: "/accounts/intake", icon: Inbox },
        { title: "Draft Quotations", href: "/accounts/quotations", icon: FileEdit },
        { title: "Client Approvals", href: "/accounts/approvals", icon: CheckCircle2 },
        { title: "T&C Templates", href: "/accounts/templates", icon: Scroll },
      ]
    },

    { title: "Divider 2", isSeparator: true },

    {
      title: "Workplace",
      icon: Users,
      subLinks: [
        { title: "Announcements", href: "/announcements", icon: Megaphone },
        { title: "EOD Reports", href: "/eod", icon: Clock },
        { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
        { title: "Apply Leave", href: "/leaves", icon: PlaneTakeoff },
      ]
    },

    { title: "Divider 3", isSeparator: true },

    {
      title: "Projects",
      icon: FolderKanban,
      subLinks: [
        { title: "All Projects", href: "/projects", icon: FolderKanban },
        { title: "Milestones", href: "/accounts/milestones", icon: Target },
        { title: "Billing & Collections", href: "/accounts/billing", icon: DollarSign },
      ]
    },

    { title: "Divider 4", isSeparator: true },

    {
      title: "Banking",
      icon: Landmark,
      subLinks: [
        { title: "Bank Accounts", href: "/accounts/banks", icon: Landmark },
        { title: "Income Ledger", href: "/accounts/ledger/income", icon: DollarSign },
        { title: "Expense Ledger", href: "/accounts/ledger/expense", icon: Receipt },
        { title: "Outstanding Payments", href: "/accounts/outstanding", icon: AlertCircle },
        { title: "Reconciliation", href: "#", icon: Scale },
        { title: "Financial Reports", href: "/accounts/reports", icon: BarChart2 },
      ]
    },

    { title: "Divider 5", isSeparator: true },

    {
      title: "Company Settings",
      icon: Settings,
      subLinks: [
        { title: "Company Details", href: "/settings/details", icon: Building2 },
        { title: "Company Accounts", href: "/settings/account", icon: Landmark },
        ...(role === "admin" ? [{ title: "Audit Logs", href: "/accounts/audit", icon: ShieldAlert }] : [])
      ]
    }
  ];

  return <BaseSidebar links={links} />;
}
