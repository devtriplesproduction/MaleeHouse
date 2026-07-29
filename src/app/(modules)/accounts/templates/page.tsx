"use client";

import React, { Suspense } from "react";
import DashboardLoading from "@/app/(modules)/loading";
import { TemplateManagementPanel } from "@/features/accounts/TemplateManagementPanel";

export default function TemplatesPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <TemplateManagementPanel />
      </div>
    </Suspense>
  );
}
