"use client";

import { Users, Calendar, Clock, DollarSign, LayoutDashboard, Settings, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";
import { SidebarLink } from "./BaseSidebar";

const hrLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/hr", icon: LayoutDashboard },
  { title: "Submit EOD", href: "/eod", icon: Clock },
  { title: "Team Management", href: "/hr/team", icon: Users },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Holidays", href: "/hr/holidays", icon: Calendar },
  { title: "My Attendance", href: "/attendance", icon: Calendar },
  { title: "Apply / Manage Leaves", href: "/leaves", icon: Calendar },
  { title: "Salary Records", href: "/hr/payroll", icon: DollarSign },
];

export function HRSidebar() {
  return <BaseSidebar links={hrLinks} />;
}
