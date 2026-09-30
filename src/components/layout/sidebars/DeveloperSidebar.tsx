"use client";

import {
  Activity,
  ScrollText,
  AlertOctagon,
  Gauge,
  Settings
} from "lucide-react";
import { BaseSidebar } from "./BaseSidebar";

const developerLinks = [
  { title: "Dashboard", href: "/developer/dashboard", icon: Activity },
  { isSeparator: true, title: "sep-dev" },
  {
    title: "Diagnostics",
    icon: Gauge,
    subLinks: [
      { title: "Activity Logs", href: "/developer/activity-logs", icon: ScrollText },
      { title: "Error Logs", href: "/developer/error-logs", icon: AlertOctagon },
      { title: "Performance", href: "/developer/performance", icon: Gauge },
    ],
  },
  {
    title: "System",
    icon: Settings,
    subLinks: [
      { title: "Developer Settings", href: "/developer/settings", icon: Settings },
    ],
  },
];

export function DeveloperSidebar() {
  return <BaseSidebar links={developerLinks} />;
}
