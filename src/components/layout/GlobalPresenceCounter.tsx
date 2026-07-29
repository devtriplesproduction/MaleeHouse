"use client";

import React from "react";
import { usePresence } from "@/hooks/usePresence";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalPresenceCounter() {
  const { count } = usePresence();

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 group">
      <div className="relative">
        <Users className="w-4 h-4 text-emerald-500" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
        {count} Online
      </span>
    </div>
  );
}
