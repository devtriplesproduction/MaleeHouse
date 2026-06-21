import React from "react";
import { getQuotationIntakeQueueAction } from "@/actions/quotation.actions";
import { QuotationIntakeQueue } from "@/features/accounts/QuotationIntakeQueue";
import { requireRole } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export default async function IntakePage() {
  const { profile } = await requireRole("accountant");
  const { data: projects } = await getQuotationIntakeQueueAction();
  const queue = projects || [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Project Intake Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {queue.length} project{queue.length !== 1 ? "s" : ""} ready for quotation
        </p>
      </div>

      <QuotationIntakeQueue
        projects={queue}
      />
    </div>
  );
}
