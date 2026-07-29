import { getUserProfileAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { PayrollClient } from '@/features/payroll/PayrollClient';
import { calculateMonthlyPayrollAction } from "@/actions/payroll.actions";

import { requireAuthenticatedUser, requirePermission } from "@/lib/security/audit";
import { Permission, Module } from "@/lib/security/permissions";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Payroll | Accounts Portal",
};

export default async function AccountsPayrollPage() {
  const context = { module: Module.PAYROLL, route: "/accounts/payroll", httpMethod: "GET" };
  
  const auth = await requireAuthenticatedUser(context);
  if (!auth.success || !auth.profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-4xl font-bold mb-2">401 Unauthorized</h1>
        <p className="text-muted-foreground">{auth.message || "You must be logged in to view this page."}</p>
      </div>
    );
  }

  const perm = await requirePermission(auth.profile, Permission.VIEW_ACCOUNTS_PAYROLL, context);
  if (!perm.authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-4xl font-bold mb-2">403 Forbidden</h1>
        <p className="text-muted-foreground">{perm.message || "Access denied. This area is restricted to Accounts personnel."}</p>
      </div>
    );
  }
  const currentUserRole = auth.profile.role;

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();

  // Fetch initial data
  const res = await calculateMonthlyPayrollAction(currentMonth, currentYear);
  const initialData = res.success && res.data ? res.data : [];
  const initialIsLocked = res.success ? !!res.isLocked : false;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PayrollClient 
        initialMonth={currentMonth}
        initialYear={currentYear}
        initialData={initialData}
        initialIsLocked={initialIsLocked}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
