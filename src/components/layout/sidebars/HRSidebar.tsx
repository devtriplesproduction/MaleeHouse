"use client";

import { Users, Calendar, Clock, DollarSign, LayoutDashboard, Settings, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";
import { SidebarLink } from "./BaseSidebar";

const hrLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/hr", icon: LayoutDashboard },
  { title: "Team Management", href: "/hr/team", icon: Users },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Holidays", href: "/hr/holidays", icon: Calendar },
  { title: "Attendance", href: "/hr/attendance", icon: Clock },
  { title: "Leaves", href: "/leaves", icon: Calendar },
  { title: "Salary Records", href: "/hr/payroll", icon: DollarSign },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function HRSidebar() {
  return <BaseSidebar links={hrLinks} />;
}
