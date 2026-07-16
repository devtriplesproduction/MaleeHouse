"use client";

import { Activity, LayoutDashboard, PenTool, MapPin, ClipboardCheck, FileText, BookOpen, Clock, Calendar, Megaphone } from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";
import { useUser } from "@/hooks/useUser";

export function OperationsSidebar() {
  const { role } = useUser();

  // Technical roles can see Operations base, their specific role view, and shared employee tools.
  const operationsLinks = [
    { title: "Technical Operations", href: "/operations", icon: Activity },
  ];

  if (role === "engineer") operationsLinks.push({ title: "Engineering", href: "/engineer", icon: LayoutDashboard });
  if (role === "cad") operationsLinks.push({ title: "CAD & Drafting", href: "/cad", icon: PenTool });
  if (role === "field") operationsLinks.push({ title: "Field Operations", href: "/field", icon: MapPin });
  if (role === "engineer") operationsLinks.push({ title: "Review Queue", href: "/review", icon: ClipboardCheck });

  operationsLinks.push(
    { title: "Assigned Projects", href: "/projects", icon: FileText },
    { title: "Procedures (SOP)", href: "/sop", icon: BookOpen },
    { title: "EOD Reports", href: "/eod", icon: Clock },
    { title: "My Attendance", href: "/attendance", icon: Calendar },
    { title: "Apply Leave", href: "/leaves", icon: Calendar },
    { title: "Announcements", href: "/announcements", icon: Megaphone }
  );

  return <BaseSidebar links={operationsLinks} />;
}
