"use client";

import { Settings, Users, BookOpen, Clock, CalendarCheck, PlaneTakeoff, FileText, Target, Building2, Megaphone, DollarSign, Landmark } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const adminLinks = [
  { title: "Admin Console", href: "/admin", icon: Settings },
  { title: "Team Management", href: "/admin/users", icon: Users },
  { title: "Project Milestones", href: "/admin/milestones", icon: Target },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Client Directory", href: "/clients", icon: Building2 },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "EOD Reports", href: "/eod", icon: Clock },
  { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Apply / Manage Leaves", href: "/leaves", icon: PlaneTakeoff },
  { title: "Salary Records", href: "/hr/payroll", icon: DollarSign },
  { 
    title: "Company Settings", 
    icon: Building2,
    subLinks: [
      { title: "Company Details", href: "/settings/details", icon: Building2 },
      { title: "Company Accounts", href: "/settings/account", icon: Landmark },
    ]
  },
];

export function AdminSidebar() {
  return <BaseSidebar links={adminLinks} />;
}
