"use client";

import { LayoutDashboard, FileText, BookOpen, Clock, Calendar, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

export function EngineerSidebar() {
  const engineerLinks = [
    { title: "Dashboard", href: "/engineer", icon: LayoutDashboard },
    { title: "Projects", href: "/projects", icon: FileText },
    { title: "SOP Library", href: "/sop", icon: BookOpen },
    { title: "Submit EOD", href: "/eod", icon: Clock },
    { title: "Apply Leave", href: "/leaves", icon: Calendar },
    { title: "Announcements", href: "/announcements", icon: Megaphone },
  ];

  return <BaseSidebar links={engineerLinks} />;
}
