"use client";

import { Users, FileText, Building, BookOpen, Clock, CalendarCheck, PlaneTakeoff, PhoneCall, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const salesLinks = [
  { title: "Sales & Leads", href: "/sales", icon: Users },
  { title: "Follow-up Calendar", href: "/sales/followups", icon: PhoneCall },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Client Directory", href: "/clients", icon: Building },
  { title: "EOD Reports", href: "/eod", icon: Clock },
  { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Apply Leave", href: "/leaves", icon: PlaneTakeoff },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
];

export function SalesSidebar() {
  return <BaseSidebar links={salesLinks} />;
}
