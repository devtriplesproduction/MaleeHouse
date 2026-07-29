"use client";

import React, { useState, useTransition } from "react";
import {
  MapPin, FileText, AlertTriangle, CheckCircle2, Clock,
  Plus, Send, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { submitFieldReportAction, type FieldReport } from "@/actions/operations.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const REPORT_TYPE_CONFIG = {
  progress: {
    label: "Progress Update",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: Clock,
  },
  completion: {
    label: "Survey Complete",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  issue: {
    label: "Issue Report",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: AlertTriangle,
  },
};

interface FieldReportPanelProps {
  projectId: string;
  reports: FieldReport[];
  userRole: string;
  isFrozen?: boolean;
}

export function FieldReportPanel({ projectId, reports, userRole, isFrozen = false }: FieldReportPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [reportType, setReportType] = useState<"progress" | "completion" | "issue">("progress");
  const [description, setDescription] = useState("");
  const [locationNotes, setLocationNotes] = useState("");

  const isField = ["field", "admin"].includes(userRole);

  const handleSubmit = () => {
    if (!description.trim()) return;
    startTransition(async () => {
      const result = await submitFieldReportAction(projectId, reportType, description, locationNotes);
      if (result?.success) {
        toast.success("Field report submitted.");
        setShowForm(false);
        setDescription("");
        setLocationNotes("");
        setReportType("progress");
        router.refresh();
      } else {
        toast.error(result?.error || "Failed to submit report.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Field Reports
          </h3>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {reports.length}
          </span>
        </div>

        {isField && (
          <button
            disabled={isFrozen}
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-black text-white rounded-xl transition-all shadow-lg",
              isFrozen 
                ? "bg-slate-400 dark:bg-white/10 opacity-50 cursor-not-allowed shadow-none" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-emerald-600/20"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {isFrozen ? "Project Frozen" : "File Report"}
          </button>
        )}
      </div>

      {/* Submit Form */}
      {showForm && isField && (
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
            New Field Report
          </p>

          {/* Report Type Selector */}
          <div className="flex gap-2">
            {(Object.keys(REPORT_TYPE_CONFIG) as Array<"progress" | "completion" | "issue">).map(
              (type) => {
                const cfg = REPORT_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl border transition-all",
                      reportType === type
                        ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                        : "bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Report Description *
              </label>
              <textarea
                placeholder="Describe the field update, findings, or issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Location / Grid Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Tuas South, Grid E3-F6"
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-black text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !description.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
            <FileText className="w-5 h-5 text-emerald-500/30" />
          </div>
          <p className="text-sm font-bold text-slate-500">No field reports yet</p>
          <p className="text-xs text-slate-600">
            {isField ? "File your first field report above." : "Awaiting field team reports."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => {
            const cfg = REPORT_TYPE_CONFIG[report.report_type as keyof typeof REPORT_TYPE_CONFIG];
            const Icon = cfg.icon;
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                className={cn(
                  "rounded-2xl border transition-all",
                  cfg.bg,
                  cfg.border
                )}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center",
                      cfg.bg
                    )}>
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          cfg.bg, cfg.color
                        )}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        By {report.submitted_by_profile?.first_name} ·{" "}
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="h-px bg-slate-200 dark:bg-white/8" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
                        Report
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        {report.description}
                      </p>
                    </div>
                    {report.location_notes && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
                          Location Notes
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {report.location_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
