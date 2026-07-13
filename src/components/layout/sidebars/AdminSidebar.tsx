"use client";

import { Settings, Users, BookOpen, Clock, Calendar, FileText, Target, Building2, Megaphone, DollarSign, Landmark } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const adminLinks = [
  { title: "Admin Console", href: "/admin", icon: Settings },
  { title: "Team Management", href: "/admin/users", icon: Users },
  { title: "Project Milestones", href: "/admin/milestones", icon: Target },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "Submit / Review EOD", href: "/eod", icon: Clock },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Apply / Manage Leaves", href: "/leaves", icon: Calendar },
  {
    title: "Company Settings",
    icon: Building2,
    subLinks: [
      { title: "Company Account", href: "/settings/account", icon: Landmark },
      { title: "Company Details", href: "/settings/details", icon: Building2 },
    ]
  },
  { title: "Salary Records", href: "/hr/payroll", icon: DollarSign },
];

export function AdminSidebar() {
  return <BaseSidebar links={adminLinks} />;
}
