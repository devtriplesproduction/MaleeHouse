import React from "react";
import { FollowUpCalendar } from "@/features/sales/components/FollowUpCalendar";
import { getSalesPipelineAction } from "@/actions/project.actions";
import { requireRole } from "@/lib/auth-guard";
import { Calendar, ArrowLeft, PhoneCall } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Follow-Up Calendar | Survey Workflow",
  description: "View and manage scheduled customer check-ins and lead telemetry.",
};

export default async function SalesFollowUpsPage() {
  // Ensure the user has sales credentials
  const { profile } = await requireRole("sales");

  // Fetch active sales pipeline leads containing follow-up schedules
  const { data: pipelineData } = await getSalesPipelineAction();
  const leads = pipelineData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── Breadcrumb & Title Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 animate-pulse">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Follow-Up Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Interact with your visual calendar matrix and prioritize client engagements.
            </p>
          </div>
        </div>

        <Link 
          href="/sales" 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-xs font-bold outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Active Deal Flow
        </Link>
      </div>

      {/* ── Dedicated Full-screen Calendar Workspace ── */}
      <div className="w-full">
        <FollowUpCalendar leads={leads} />
      </div>

    </div>
  );
}
