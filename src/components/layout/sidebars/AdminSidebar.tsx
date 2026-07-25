"use client";

import { Settings, Users, BookOpen, Clock, CalendarCheck, PlaneTakeoff, FileText, Target, Building2, Megaphone, DollarSign, Landmark, UserCheck, Shield } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const adminLinks = [
  { title: "Admin Console", href: "/admin", icon: Settings },
  { 
    title: "Team Management", 
    icon: Users,
    subLinks: [
      { title: "Employees", href: "/admin/users", icon: Users },
      { title: "Departments", href: "/admin/hr/employees", icon: UserCheck },
      { title: "Roles & Permissions", href: "/admin/settings", icon: Shield },
    ]
  },
  { title: "Project Milestones", href: "/admin/milestones", icon: Target },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Client Directory", href: "/clients", icon: Building2 },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { 
    title: "HR & Attendance",
    icon: Clock,
    subLinks: [
      { title: "Attendance", href: "/admin/hr/attendance", icon: UserCheck },
      { title: "Leave Management", href: "/admin/hr/team", icon: Users },
      { title: "Announcements", href: "/announcements", icon: Megaphone },
    ]
  },
  { title: "Salary Records", href: "/admin/hr/payroll", icon: DollarSign },
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
