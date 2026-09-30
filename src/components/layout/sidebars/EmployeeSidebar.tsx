"use client";

import { FileText, BookOpen, Clock, CalendarCheck, PlaneTakeoff, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const employeeLinks = [
  { title: "Assigned Projects", href: "/projects", icon: FileText },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "EOD Reports", href: "/eod", icon: Clock },
  { title: "My Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Apply Leave", href: "/leaves", icon: PlaneTakeoff },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
];

export function EmployeeSidebar() {
  return <BaseSidebar links={employeeLinks} />;
}
