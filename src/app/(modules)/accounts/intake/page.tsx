import React from "react";
import { getQuotationIntakeQueueAction } from "@/actions/quotation.actions";
import { QuotationIntakeQueue } from "@/features/accounts/QuotationIntakeQueue";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/modules/PageHeader";
import { ClipboardList } from "lucide-react";

export default async function IntakePage() {
  const { profile } = await requireRole("accountant");
  const { data: projects } = await getQuotationIntakeQueueAction();
  const queue = projects || [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title="Project Intake Queue"
        subtitle={`${queue.length} project${queue.length !== 1 ? "s" : ""} ready for quotation`}
        icon={ClipboardList}
      />

      <QuotationIntakeQueue
        projects={queue}
      />
    </div>
  );
}
