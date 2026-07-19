"use client";

import React, { useState, useEffect } from "react";

import { 
  calculateMonthlyPayrollAction, 
  lockPayrollCycleAction,
  unlockPayrollCycleAction,
  notifySalarySlipsAction,
  emailSalarySlipAction,
  getSalarySlipUrlAction,
  PayrollSnapshot
} from "@/actions/payroll.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Lock, Unlock, Download, Loader2, FileText, Printer, Mail, Share2, Layers } from "lucide-react";
import { toast } from "sonner";
import { BankAccountSelector } from "@/components/ui/BankAccountSelector";
import { SalarySlipPreviewDialog } from "@/components/modules/SalarySlipPreviewDialog";
import { ShareSalarySlipDialog } from "@/components/modules/ShareSalarySlipDialog";
import { BulkPayrollOperationsDialog } from "@/components/modules/BulkPayrollOperationsDialog";

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
  const [fetchingUrl, setFetchingUrl] = useState<string | null>(null);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string, url: string} | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

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

  const getPdfUrl = (employeeId: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!supabaseUrl) return '';
    return `${supabaseUrl}/storage/v1/object/public/salary_slips/salary_slip_${employeeId}_${month}_${year}.pdf`;
  };

  
  const handleNotifyAll = async () => {
    const currentCycleId = data.length > 0 ? data[0].cycle_id : null;
    if (!currentCycleId) return;
    setActionLoading(true);
    const loadingToastId = toast.loading(`Sending notifications to all employees...`);
    const res = await notifySalarySlipsAction(currentCycleId);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message, { id: loadingToastId });
      fetchData(month, year); // Reload to update status
    } else {
      toast.error(res.error || "Failed to send notifications.", { id: loadingToastId });
    }
  };

  const handleViewSlip = async (row: any) => {
    setFetchingUrl(row.id);
    const res = await getSalarySlipUrlAction(row.id, row.employee_id, month, year);
    setFetchingUrl(null);
    
    if (res.success && res.url) {
      setSelectedEmployee({
        id: row.id,
        name: row.employee_name,
        url: res.url
      });
      setPreviewOpen(true);
    } else {
      toast.error(res.error || "Salary slip not generated.");
    }
  };

  const handleDownloadSlip = async (row: any) => {
    setFetchingUrl(row.id + '-dl');
    const res = await getSalarySlipUrlAction(row.id, row.employee_id, month, year);
    setFetchingUrl(null);
    
    if (res.success && res.url) {
      const link = document.createElement('a');
      link.href = res.url;
      link.download = `Salary_Slip_${row.employee_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error(res.error || "Salary slip not generated.");
    }
  };

  const handleOpenShare = (row: any) => {
    setSelectedEmployee({
      id: row.id,
      name: row.employee_name,
      url: "" // Not needed for share dialog
    });
    setShareOpen(true);
  };

  const handleEmailSlip = async (row: any) => {
    const loadingToastId = toast.loading(`Emailing salary slip to ${row.employee_name}...`);
    const res = await emailSalarySlipAction(row.id);
    if (res.success) {
      toast.success(res.message, { id: loadingToastId });
    } else {
      toast.error(res.error || "Failed to email salary slip", { id: loadingToastId });
    }
  };

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
              <>
                <Button variant="outline" className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" onClick={handleNotifyAll} disabled={loading || actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Notify Employees
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleUnlock} disabled={loading || actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                  Unlock Cycle
                </Button>
              </>
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
          <div className="flex items-center gap-2">
            {isLocked && (
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => setBulkOpen(true)}>
                <Layers className="w-4 h-4 mr-2" />
                Bulk Actions
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-slate-500">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
                    <TableHead className="text-center">Notification</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
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
                        <TableCell className="text-center">
                          {row.notification_status === 'Sent' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Sent</Badge>
                          ) : row.notification_status === 'Failed' ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Failed</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked || fetchingUrl === row.id} title="View Salary Slip" onClick={() => handleViewSlip(row)}>
                              {fetchingUrl === row.id ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <FileText className="w-4 h-4 text-slate-500" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked || fetchingUrl === row.id + '-dl'} title="Download PDF" onClick={() => handleDownloadSlip(row)}>
                              {fetchingUrl === row.id + '-dl' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Download className="w-4 h-4 text-blue-500" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked} title="Print">
                              <Printer className="w-4 h-4 text-emerald-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked} title="Email" onClick={() => handleEmailSlip(row)}>
                              <Mail className="w-4 h-4 text-amber-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked} title="Share" onClick={() => handleOpenShare(row)}>
                              <Share2 className="w-4 h-4 text-purple-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-slate-500">
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

      <SalarySlipPreviewDialog 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        employeeName={selectedEmployee?.name || ''} 
        pdfUrl={selectedEmployee?.url} 
      />

      {selectedEmployee && (
        <ShareSalarySlipDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          snapshotId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}

      {isLocked && (
        <BulkPayrollOperationsDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          snapshots={data}
          month={month}
          year={year}
          getPdfUrl={getPdfUrl}
        />
      )}
    </div>
  );
}
