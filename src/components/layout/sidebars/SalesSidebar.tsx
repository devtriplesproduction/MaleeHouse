"use client";

import { Users, FileText, Building, BookOpen, Clock, Calendar, PhoneCall } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const salesLinks = [
  { title: "Sales & Leads", href: "/sales", icon: Users },
  { title: "Follow-up Calendar", href: "/sales/followups", icon: PhoneCall },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Client Directory", href: "/clients", icon: Building },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "Submit EOD", href: "/eod", icon: Clock },
  { title: "Apply Leave", href: "/leaves", icon: Calendar },
];

export function SalesSidebar() {
  return <BaseSidebar links={salesLinks} />;
}
