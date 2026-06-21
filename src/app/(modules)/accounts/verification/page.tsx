"use client";

import React, { useState, useEffect } from "react";
import { getPaymentsAction } from "@/actions/finance.actions";
import { PaymentVerificationList } from "@/features/accounts/PaymentVerificationList";
import { Receipt, AlertTriangle } from "lucide-react";
import DashboardLoading from "@/app/(modules)/loading";

export default function VerificationPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await getPaymentsAction();
    if (res && res.data) setPayments(res.data.filter((p: any) => p.status === "pending"));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <DashboardLoading />;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Payment Verification
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {payments.length} pending verification{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="py-20 text-center">
          <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All payments have been verified.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4 flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Action Required:</strong> Approving a payment transitions the project from{" "}
              <code className="bg-amber-100 dark:bg-amber-500/10 px-1 rounded">payment_pending</code> to{" "}
              <code className="bg-amber-100 dark:bg-amber-500/10 px-1 rounded">project_created</code>, initiating the Engineering workflow.
            </p>
          </div>
          <PaymentVerificationList payments={payments} />
        </div>
      )}
    </div>
  );
}
