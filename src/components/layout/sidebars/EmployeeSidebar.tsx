"use client";

import { FileText, BookOpen, Clock, Calendar } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const employeeLinks = [
  { title: "Assigned Projects", href: "/projects", icon: FileText },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "Submit EOD", href: "/eod", icon: Clock },
  { title: "Apply Leave", href: "/leaves", icon: Calendar },
];

export function EmployeeSidebar() {
  return <BaseSidebar links={employeeLinks} />;
}
