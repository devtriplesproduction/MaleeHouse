"use client";

import React, { Suspense } from "react";
import DashboardLoading from "@/app/(modules)/loading";
import { BankManagementPanel } from "@/features/accounts/BankManagementPanel";

export default function BanksPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <BankManagementPanel />
      </div>
    </Suspense>
  );
}
