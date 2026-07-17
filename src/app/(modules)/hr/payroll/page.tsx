import React from 'react';
import { DollarSign } from 'lucide-react';

export const metadata = {
  title: "Salary Records | HR Portal",
};

export default function SalaryRecordsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] animate-in fade-in duration-700">
      <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6">
        <DollarSign className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Salary Records Module</h2>
      <p className="text-slate-500 mt-2 max-w-md text-center">
        This module is currently under development. Soon you'll be able to manage employee payroll, bonuses, and salary histories here.
      </p>
    </div>
  );
}
