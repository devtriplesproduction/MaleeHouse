import React from 'react';
import { calculateMonthlyPayrollAction } from '@/actions/payroll.actions';
import { PayrollClient } from './PayrollClient';
import { requireRole } from '@/lib/auth-guard';

export const metadata = {
  title: "Salary Records | HR Portal",
};

export default async function SalaryRecordsPage() {
  const { profile } = await requireRole("hr");
  const currentUserRole = profile?.role || 'hr';

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
