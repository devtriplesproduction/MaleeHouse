"use client";

import React, { useEffect, useState, useTransition } from "react";
import { 
  ArrowRightCircle, 
  FileUp, 
  UserPlus, 
  MessageSquare, 
  Clock, 
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getGlobalActivityAction, type GlobalActivityItem, type ActivityType } from "@/actions/activity.actions";
import { useRealtimeContext } from "@/providers/RealtimeProvider";
import { STAGE_LABELS, type ProjectStage } from "@/features/workflow/WorkflowStepper";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ACTIVITY_CONFIG: Record<ActivityType, { icon: React.ElementType, color: string, bg: string, label: string }> = {
  stage_change: { icon: ArrowRightCircle, color: "text-indigo-600", bg: "bg-indigo-50",  label: "Stage Update" },
  file_upload:  { icon: FileUp,           color: "text-emerald-600", bg: "bg-emerald-50", label: "File Upload" },
  assignment:   { icon: UserPlus,         color: "text-blue-600",    bg: "bg-blue-50",    label: "Assignment" },
  comment:      { icon: MessageSquare,    color: "text-amber-600",   bg: "bg-amber-50",   label: "Discussion" },
};

export function GlobalActivityStream() {
  const [activities, setActivities] = useState<GlobalActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const { notificationVersion } = useRealtimeContext();

  const fetchActivity = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    const data = await getGlobalActivityAction();
    setActivities(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivity(true);
  }, []);

  // Live refresh trigger
  useEffect(() => {
    if (isLive) {
      fetchActivity();
    }
  }, [notificationVersion, isLive]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Live Activity Stream</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all",
              isLive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-500"
            )}
          >
            <RefreshCw className={cn("w-3 h-3", isLive && "animate-spin-slow")} />
            {isLive ? "LIVE" : "PAUSED"}
          </button>
          <button 
            onClick={() => fetchActivity(true)}
            className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stream Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5 custom-scrollbar">
        {isLoading && activities.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <LoaderIcon className="w-6 h-6 animate-spin" />
            <p className="text-xs font-medium">Syncing organizational pulse...</p>
          </div>
        ) : (
          activities?.filter((a: any) => a && a.actor && a.project).map((activity) => {
            const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.stage_change;
            const actorName = activity.actor?.name || "System User";
            const projectName = activity.project?.name || "Unknown Project";
            
            // Safe date parsing
            const date = new Date(activity.timestamp);
            const timeAgo = isNaN(date.getTime()) ? "recently" : formatDistanceToNow(date, { addSuffix: true });

            return (
              <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-start gap-3">
                  {/* Icon Node */}
                  <div className={cn("flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center", config.bg)}>
                    <config.icon className={cn("w-5 h-5", config.color)} />
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {actorName}
                        <span className="mx-1 text-slate-400 font-normal">in</span>
                        <Link 
                          href={`/projects/${activity.project?.id || '#'}`}
                          className="text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2"
                        >
                          {projectName}
                        </Link>
                      </p>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap ml-2">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                    </div>

                    {/* Dynamic Detail Content */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {activity.type === "stage_change" && (
                        <div className="flex items-center gap-1.5">
                          <span>Advanced to</span>
                          <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded font-bold uppercase tracking-tighter text-xs">
                            {STAGE_LABELS[activity.details.to as ProjectStage] || activity.details.to}
                          </span>
                        </div>
                      )}
                      {activity.type === "file_upload" && (
                        <div className="flex items-center gap-1.5">
                          <span>Uploaded</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 underline decoration-slate-300 truncate max-w-[150px]">
                            {activity.details.fileName}
                          </span>
                          <span className="text-xs bg-slate-100 dark:bg-white/5 px-1 rounded uppercase tracking-widest font-bold">
                            {activity.details.category}
                          </span>
                        </div>
                      )}
                      {activity.type === "assignment" && (
                        <span>Assigned as <span className="font-bold text-blue-600 uppercase tracking-wider">{activity.details.category}</span></span>
                      )}
                      {activity.type === "comment" && (
                        <div className="flex items-start gap-1">
                          <span className="flex-shrink-0 italic">"</span>
                          <span className="italic truncate">{activity.details.content}</span>
                          <span className="flex-shrink-0 italic">"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link 
                    href={`/projects/${activity.project.id}`}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 dark:bg-transparent border-t border-slate-100 dark:border-white/5 text-center">
        <button className="text-xs font-extrabold text-indigo-500 hover:text-indigo-600 uppercase tracking-widest">
          View Full Audit Log
        </button>
      </div>
    </div>
  );
}

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
