"use client";

import Link from "next/link";
import { Users, Megaphone, CalendarHeart, Briefcase } from "lucide-react";

export function HRQuickLinks() {
  const links = [
    {
      title: "Employee Directory",
      description: "Manage staff & onboardings",
      icon: Users,
      href: "/hr/employees",
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      border: "border-indigo-100 dark:border-indigo-500/20",
    },
    {
      title: "Recruitment",
      description: "Pipeline & open roles",
      icon: Briefcase,
      href: "/hr/recruitment",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-100 dark:border-blue-500/20",
    },
    {
      title: "Holidays",
      description: "Manage yearly calendar",
      icon: CalendarHeart,
      href: "/hr/holidays",
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-500/10",
      border: "border-pink-100 dark:border-pink-500/20",
    },
    {
      title: "New Announcement",
      description: "Broadcast to company",
      icon: Megaphone,
      href: "/hr/announcements/new",
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      border: "border-violet-100 dark:border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {links.map((link, idx) => (
        <Link 
          key={idx} 
          href={link.href}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${link.border} bg-white dark:bg-slate-900/50`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${link.bg} ${link.color}`}>
            <link.icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
              {link.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {link.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
