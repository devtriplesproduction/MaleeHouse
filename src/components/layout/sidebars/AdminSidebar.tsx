"use client";

import { Settings, Users, BookOpen, Clock, Calendar, FileText, Target, Building2, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const adminLinks = [
  { title: "Admin Console", href: "/admin", icon: Settings },
  { title: "Team Management", href: "/admin/users", icon: Users },
  { title: "Project Milestones", href: "/admin/milestones", icon: Target },
  { title: "All Projects", href: "/projects", icon: FileText },
  { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
  { title: "Review EOD", href: "/eod", icon: Clock },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Leave Approvals", href: "/leaves", icon: Calendar },
  { title: "Company Settings", href: "/settings", icon: Building2 },
];

export function AdminSidebar() {
  return <BaseSidebar links={adminLinks} />;
}
