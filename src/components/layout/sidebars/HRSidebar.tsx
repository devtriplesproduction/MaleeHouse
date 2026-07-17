"use client";

import { Users, Calendar, Clock, DollarSign, LayoutDashboard, Megaphone, CalendarCheck, PlaneTakeoff, Palmtree } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";
import { SidebarLink } from "./BaseSidebar";

const hrLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/hr", icon: LayoutDashboard },
  { title: "EOD Reports", href: "/eod", icon: Clock },
  { title: "Salary Records", href: "/hr/payroll", icon: DollarSign },
  { title: "Team Management", href: "/hr/team", icon: Users },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Apply / Manage Leaves", href: "/leaves", icon: PlaneTakeoff },
  { title: "Holidays", href: "/hr/holidays", icon: Palmtree },
];

export function HRSidebar() {
  return <BaseSidebar links={hrLinks} />;
}
