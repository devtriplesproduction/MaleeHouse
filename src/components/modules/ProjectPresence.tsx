"use client";

import React from "react";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

interface ProjectPresenceProps {
  projectId: string;
}

export function ProjectPresence({ projectId }: ProjectPresenceProps) {
  const { viewingProject } = usePresence();
  const activeCollaborators = viewingProject(projectId);

  if (activeCollaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full shadow-sm">
      <div className="flex -space-x-2 overflow-hidden">
        {activeCollaborators.map((u) => {
          const initials = u.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={u.userId}
              title={`${u.name} (${u.role}) is also viewing this project`}
              className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 flex items-center justify-center transition-transform hover:scale-110 hover:z-20 cursor-help"
            >
              <span className="text-xs font-bold text-white leading-none">
                {initials}
              </span>
              {/* Online pulse dot */}
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>
          );
        })}
      </div>
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {activeCollaborators.length} {activeCollaborators.length === 1 ? "peer" : "peers"} viewing
      </span>
    </div>
  );
}
