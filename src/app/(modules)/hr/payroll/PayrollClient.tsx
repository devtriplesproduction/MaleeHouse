"use client";

import React, { useState, useEffect } from "react";

import { 
  calculateMonthlyPayrollAction, 
  lockPayrollCycleAction, 
  unlockPayrollCycleAction,
  PayrollSnapshot
} from "@/actions/payroll.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Lock, Unlock, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BankAccountSelector } from "@/components/ui/BankAccountSelector";

interface PayrollClientProps {
  initialMonth: number;
  initialYear: number;
  initialData: PayrollSnapshot[];
  initialIsLocked: boolean;
  currentUserRole: string;
}

export function PayrollClient({ 
  initialMonth, 
  initialYear, 
  initialData, 
  initialIsLocked,
  currentUserRole
}: PayrollClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<PayrollSnapshot[]>(initialData);
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bankId, setBankId] = useState('');

  useEffect(() => {
    if (month !== initialMonth || year !== initialYear) {
      fetchData(month, year);
    } else {
      setData(initialData);
      setIsLocked(initialIsLocked);
    }
  }, [month, year, initialMonth, initialYear, initialData, initialIsLocked]);

  const fetchData = async (m: number, y: number) => {
    setLoading(true);
    const res = await calculateMonthlyPayrollAction(m, y);
    if (res.success && res.data) {
      setData(res.data);
      setIsLocked(res.isLocked || false);
    } else {
      toast.error(res.error || "Failed to fetch payroll data");
    }
    setLoading(false);
  };

  const handlePrevMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleLock = async () => {
    if (!bankId) {
      toast.error('Please select a bank account before locking payroll.');
      return;
    }
    if (!confirm(`Are you sure you want to lock the payroll for ${month}/${year}? This will freeze all calculations.`)) return;
    
    setActionLoading(true);
    const res = await lockPayrollCycleAction(month, year, bankId);
    if (res.success) {
      toast.success(res.message);
      setIsLocked(true);
      fetchData(month, year);
    } else {
      toast.error(res.error || "Failed to lock payroll");
    }
    setActionLoading(false);
  };

  const handleUnlock = async () => {
    if (!confirm(`Are you sure you want to unlock the payroll for ${month}/${year}? This will revert it to draft mode and recalculate based on current attendance.`)) return;
    
    setActionLoading(true);
    const res = await unlockPayrollCycleAction(month, year);
    if (res.success) {
      toast.success(res.message);
      setIsLocked(false);
      fetchData(month, year);
    } else {
      toast.error(res.error || "Failed to unlock payroll");
    }
    setActionLoading(false);
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Salary Records</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and process employee payroll</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} disabled={loading || actionLoading}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 font-medium min-w-[120px] text-center">
              {monthName} {year}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={loading || actionLoading}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {(currentUserRole === 'admin' || currentUserRole === 'hr') && (
            isLocked ? (
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleUnlock} disabled={loading || actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                Unlock Cycle
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-64">
                  <BankAccountSelector
                    value={bankId}
                    onChange={setBankId}
                    required
                    showLabel={false}
                  />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLock} disabled={loading || actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Lock &amp; Process
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Payroll Details
            {isLocked ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Locked (Processed)</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Draft (Live Calc)</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-slate-500">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500">Calculating payroll data...</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Leaves</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-right font-bold text-indigo-600 dark:text-indigo-400">Net Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.length > 0 ? (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <div>{row.employee_name}</div>
                          <div className="text-xs text-slate-500">{row.department}</div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{row.employee_id_external}</TableCell>
                        <TableCell className="text-right font-medium">₹{row.base_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-emerald-600 font-medium">{row.days_present + row.days_field}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-amber-600" title="Paid Leave">{row.days_paid_leave}</span> / <span className="text-red-500" title="Unpaid Leave">{row.days_unpaid_leave}</span>
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">{row.days_absent}</TableCell>
                        <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{row.net_payable.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                        No employees found for this payroll cycle.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
