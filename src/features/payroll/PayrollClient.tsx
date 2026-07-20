"use client";

import React, { useState, useEffect } from "react";
import { 
  calculateMonthlyPayrollAction, 
  savePayrollDraftAdjustmentsAction,
  getSalarySlipUrlAction,
  emailSalarySlipAction,
  notifySalarySlipsAction,
  PayrollSnapshot
} from "@/actions/payroll.actions";
import {
  submitPayrollToAccountsAction,
  returnPayrollToDraftAction,
  approveAndLockPayrollAction,
  generateSlipRunAction,
  releaseSlipsAction,
  markPaymentCompletedAction,
  getPayrollAuditLogsAction
} from "@/actions/payroll_workflow.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Download, 
  Loader2, 
  FileText, 
  Mail, 
  Share2, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  DollarSign, 
  Clock, 
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { BankAccountSelector } from "@/components/ui/BankAccountSelector";
import { SalarySlipPreviewDialog } from "@/components/modules/SalarySlipPreviewDialog";
import { ShareSalarySlipDialog } from "@/components/modules/ShareSalarySlipDialog";
import { BulkPayrollOperationsDialog } from "@/components/modules/BulkPayrollOperationsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import { createLedgerEntryAction } from "@/actions/ledger.actions";

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
  
  // Cycle state & caches
  const [cycle, setCycle] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [payrollStatus, setPayrollStatus] = useState<string>("draft");
  const [slipStatus, setSlipStatus] = useState<string>("none");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");

  // Summary card state
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [grossPayroll, setGrossPayroll] = useState(0);
  const [totalAdditions, setTotalAdditions] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netPayroll, setNetPayroll] = useState(0);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string, url: string} | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<any[]>([]);
  const [selectedTimelineEmpId, setSelectedTimelineEmpId] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Ledger Intake
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);
  const [ledgerType, setLedgerType] = useState('salary_advance');
  const [ledgerAmount, setLedgerAmount] = useState<number | ''>('');
  const [ledgerDesc, setLedgerDesc] = useState('');

  // Lock Checklist & Return Modals
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [checklist, setChecklist] = useState({
    attendance: false,
    advances: false,
    bonuses: false,
    deductions: false,
    net_payroll: false
  });

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payBankId, setPayBankId] = useState("");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState("");
  
  const [draftApps, setDraftApps] = useState<any[]>([]);
  const [reviewedEmployees, setReviewedEmployees] = useState<Set<string>>(new Set());
  const [fetchingUrl, setFetchingUrl] = useState<string | null>(null);

  // Load reviewed employees from localStorage
  useEffect(() => {
    if (isLocked && data.length > 0) {
      setReviewedEmployees(new Set(data.map(d => d.employee_id)));
    } else {
      const saved = localStorage.getItem(`reviewed-payroll-${year}-${month}`);
      if (saved) {
        setReviewedEmployees(new Set(JSON.parse(saved)));
      } else {
        setReviewedEmployees(new Set());
      }
    }
  }, [month, year, isLocked, data]);


  const liveData = React.useMemo(() => {
    return data.map((r: any) => {
      let diffBonus = 0;
      let diffDed = 0;

      const empDrafts = draftApps.filter(d => d.employee_id === r.employee_id);
      empDrafts.forEach(d => {
        if (d.adjustment_type === 'bonus') {
           const origBonus = r.adjustments?.find((a:any) => a.adjustment_type === 'bonus')?.applied_amount || 0;
           diffBonus += (Number(d.applied_amount) - origBonus);
        } else if (d.adjustment_type === 'salary_advance') {
           const origSalAdv = r.salary_advance_recovery || 0;
           diffDed += (Number(d.applied_amount) - origSalAdv);
        } else if (d.adjustment_type === 'other_deduction') {
           const origOther = r.other_deductions || 0;
           diffDed += (Number(d.applied_amount) - origOther);
        }
      });

      return {
         ...r,
         live_bonus: (r.bonus || 0) + diffBonus,
         live_deductions: (r.total_deductions || 0) + diffDed,
         live_gross: (r.gross_salary || 0) + diffBonus,
         live_net: (r.net_salary || 0) + diffBonus - diffDed
      };
    });
  }, [data, draftApps]);

  useEffect(() => {
    fetchData(month, year);
  }, [month, year]);

  const fetchData = async (m: number, y: number) => {
    setLoading(true);
    const res = await calculateMonthlyPayrollAction(m, y);
    if (res?.success && res?.data) {
      setData(res.data);
      setIsLocked(res.isLocked || false);
      const activeCycle = res.cycle;
      setCycle(activeCycle);
      
      if (activeCycle) {
        setBatchNumber(activeCycle.batch_number || `PAY-${y}-${String(m).padStart(2, '0')}-001`);
        setPayrollStatus(activeCycle.status || "draft");
        setSlipStatus(activeCycle.slip_status || "none");
        setPaymentStatus(activeCycle.payment_status || "unpaid");
        
        // Use frozen summaries if locked, otherwise compute
        if (activeCycle.status === 'locked') {
          setTotalEmployees(activeCycle.total_employees || res.data.length);
          setGrossPayroll(Number(activeCycle.gross_payroll) || 0);
          setNetPayroll(Number(activeCycle.net_payroll) || 0);
          setTotalDeductions(Number(activeCycle.total_deductions) || 0);
          setTotalAdditions(Number(activeCycle.total_additions) || 0);
        } else {
          // calculated by effect
        }
      } else {
        setBatchNumber(`PAY-${y}-${String(m).padStart(2, '0')}-001`);
        setPayrollStatus("draft");
        setSlipStatus("none");
        setPaymentStatus("unpaid");
        // calculated by effect
      }
    } else {
      toast.error(res?.error || "Failed to fetch payroll data");
    }
    setLoading(false);
  };

  
  React.useEffect(() => {
    if (cycle && cycle.status === 'locked') {
      setTotalEmployees(cycle.total_employees || data.length);
      setGrossPayroll(Number(cycle.gross_payroll) || 0);
      setNetPayroll(Number(cycle.net_payroll) || 0);
      setTotalDeductions(Number(cycle.total_deductions) || 0);
      setTotalAdditions(Number(cycle.total_additions) || 0);
    } else {
      setTotalEmployees(liveData.length);
      setGrossPayroll(liveData.reduce((sum, r) => sum + (r.live_gross || 0), 0));
      setNetPayroll(liveData.reduce((sum, r) => sum + (r.live_net || 0), 0));
      setTotalAdditions(liveData.reduce((sum, r) => sum + (r.live_bonus || 0), 0));
      setTotalDeductions(liveData.reduce((sum, r) => sum + (r.live_deductions || 0), 0));
    }
  }, [liveData, cycle, data.length]);


  const handleSaveDrafts = async () => {
    if (draftApps.length === 0) return;
    setActionLoading(true);
    try {
      const cycleId = data.length > 0 ? data[0].cycle_id : null;
      if (!cycleId) throw new Error("Cycle ID missing.");
      
      const res = await savePayrollDraftAdjustmentsAction(cycleId, draftApps);
      if (res?.success) {
        toast.success(res.message);
        setDraftApps([]); 
        await fetchData(month, year);
      } else {
        toast.error(res?.error || "Failed to save drafts");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setActionLoading(false);
  };

  const handleUpdateDraft = (employeeId: string, adjustmentType: string, amount: number) => {
    if (isLocked) return;
    setDraftApps(prev => {
      const existing = prev.find(p => p.employee_id === employeeId && p.adjustment_type === adjustmentType);
      if (existing) {
        return prev.map(p => p === existing ? { ...p, applied_amount: amount } : p);
      }
      return [...prev, { employee_id: employeeId, adjustment_type: adjustmentType, applied_amount: amount }];
    });
  };

  const toggleReviewed = (employeeId: string) => {
    if (isLocked) return;
    setReviewedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      localStorage.setItem(`reviewed-payroll-${year}-${month}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenTimeline = async (empId: string, adjustments: any[]) => {
    setSelectedTimelineEmpId(empId);
    setSelectedTimeline(adjustments);
    setTimelineOpen(true);
    setAddLedgerOpen(false);
  };

  const handleAddLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimelineEmpId || !ledgerAmount) return;
    setActionLoading(true);
    const res = await createLedgerEntryAction(selectedTimelineEmpId, ledgerType, Number(ledgerAmount), ledgerDesc);
    setActionLoading(false);
    if (res.success) {
      toast.success("Ledger entry created");
      setAddLedgerOpen(false);
      setLedgerAmount('');
      setLedgerDesc('');
      fetchData(month, year);
    } else {
      toast.error(res.error || "Failed to create entry");
    }
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

  // NEW WORKFLOW ACTIONS
  const handleSubmitToAccounts = async () => {
    setActionLoading(true);
    const res = await submitPayrollToAccountsAction(month, year);
    if (res?.success) { 
      toast.success(res.message); 
      fetchData(month, year); 
    } else { 
      toast.error(res?.error || "Failed to submit payroll."); 
    }
    setActionLoading(false);
  };

  const handleReturnToDraft = async () => {
    setActionLoading(true);
    const res = await returnPayrollToDraftAction(month, year);
    if (res?.success) {
      toast.success(res.message);
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to return payroll to draft.");
    }
    setActionLoading(false);
  };

  const handleLock = () => {
    setLockModalOpen(true);
  };

  const confirmLock = async () => {
    if (!checklist.attendance || !checklist.advances || !checklist.bonuses || !checklist.deductions || !checklist.net_payroll) {
        toast.error("Please complete the entire review checklist before locking."); 
        return;
    }
    setLockModalOpen(false);
    setActionLoading(true);
    const res = await approveAndLockPayrollAction(month, year, checklist);
    if (res?.success) {
      toast.success(res.message);
      setIsLocked(true);
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to lock payroll.");
    }
    setActionLoading(false);
  };

  const handleGenerateSlips = async () => {
    if (!cycle?.id) return;
    setActionLoading(true);
    const res = await generateSlipRunAction(cycle.id);
    if (res?.success) {
      toast.success(res.message);
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to generate slips.");
    }
    setActionLoading(false);
  };

  const handleReleaseSlips = async () => {
    if (!cycle?.id) return;
    setActionLoading(true);
    const res = await releaseSlipsAction(cycle.id);
    if (res?.success) {
      toast.success(res.message);
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to release slips.");
    }
    setActionLoading(false);
  };

  const handleOpenPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  const handleMarkPaymentCompleted = async () => {
    if (!payBankId) {
      toast.error("Please select the funding Bank Account.");
      return;
    }
    setPaymentModalOpen(false);
    setActionLoading(true);
    const res = await markPaymentCompletedAction(cycle.id, {
      bank_id: payBankId,
      payment_date: payDate,
      payment_method: payMethod,
      payment_reference: payRef,
      payment_total_amount: netPayroll,
      payment_notes: payNotes
    });
    if (res?.success) {
      toast.success(res.message);
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to record payment.");
    }
    setActionLoading(false);
  };

  const handleUnlock = () => {
    setUnlockModalOpen(true);
  };

  const confirmUnlock = async () => {
    if (!unlockReason.trim()) {
      toast.error("Unlock reason is required.");
      return;
    }
    setUnlockModalOpen(false);
    setActionLoading(true);
    const res = await returnPayrollToDraftAction(month, year);
    if (res?.success) {
      toast.success(res.message);
      setUnlockReason("");
      fetchData(month, year);
    } else {
      toast.error(res?.error || "Failed to unlock.");
    }
    setActionLoading(false);
  };

  const handleViewAuditTimeline = async () => {
    if (!cycle?.id) return;
    const res = await getPayrollAuditLogsAction(cycle.id);
    if (res?.success && res.data) {
      setAuditLogs(res.data);
      setAuditOpen(true);
    } else {
      toast.error("Failed to load audit logs.");
    }
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  const getPdfUrl = (employeeId: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!supabaseUrl) return '';
    return `${supabaseUrl}/storage/v1/object/public/salary_slips/${year}/${month}/${employeeId}/salary-slip.pdf`;
  };

  const handleViewSlip = async (row: any) => {
    setFetchingUrl(row.id);
    const res = await getSalarySlipUrlAction(row.id, row.employee_id, month, year);
    setFetchingUrl(null);
    if (res?.success && res?.url) {
      setSelectedEmployee({
        id: row.id,
        name: row.employee_name,
        url: res.url
      });
      setPreviewOpen(true);
    } else {
      toast.error(res?.error || "Salary slip not generated.");
    }
  };

  const handleDownloadSlip = async (row: any) => {
    setFetchingUrl(row.id + '-dl');
    const res = await getSalarySlipUrlAction(row.id, row.employee_id, month, year);
    setFetchingUrl(null);
    if (res?.success && res.url) {
      const link = document.createElement('a');
      link.href = res.url;
      link.download = `Salary_Slip_${row.employee_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error(res?.error || "Salary slip not generated.");
    }
  };

  const handleOpenShare = (row: any) => {
    setSelectedEmployee({
      id: row.id,
      name: row.employee_name,
      url: ""
    });
    setShareOpen(true);
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Base Salary",
      "Present",
      "Paid Leave",
      "Unpaid Leave",
      "Absent",
      "Net Payable",
      "Gross Salary",
      "Bonus",
      "Advance Salary Recovery",
      "Other Deductions",
      "Net Salary"
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((row: any) => {
        const bonus = (row.adjustments?.filter((a:any) => ['bonus', 'festival_bonus'].includes(a.adjustment_type)).reduce((s:number, a:any) => s + a.applied_amount, 0)) || row.bonus || 0;
        return [
          `"${row.employee_name}"`,
          `"${row.employee_id_external}"`,
          `"${row.department}"`,
          row.base_salary,
          row.days_present + row.days_field,
          row.days_paid_leave,
          row.days_unpaid_leave,
          row.days_absent,
          row.net_payable,
          row.gross_salary || 0,
          bonus,
          row.salary_advance_recovery || 0,
          row.other_deductions || 0,
          row.net_salary || 0
        ].join(",")
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Salary_Records_${month}_${year}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm">
        <div className="space-y-1 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">Salary Records</h1>
            {batchNumber && (
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 whitespace-nowrap">
                {batchNumber}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Decoupled state management &amp; compliance-locked lifecycle</p>
        </div>
        
        <div className="flex items-center justify-start xl:justify-end gap-3 w-full xl:w-auto flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handlePrevMonth} disabled={loading || actionLoading}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="px-3 font-semibold min-w-[120px] text-center text-sm text-slate-700 dark:text-slate-200">
              {monthName} {year}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleNextMonth} disabled={loading || actionLoading}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Button variant="hr-outline" size="icon" className="h-11 w-11 rounded-xl" onClick={handleViewAuditTimeline} title="View Audit Logs">
            <Clock className="w-5 h-5" />
          </Button>

          {/* HR VIEW ACTIONS */}
          {(currentUserRole === 'hr' || currentUserRole === 'admin') && (
            <>
              {payrollStatus === 'draft' && (
                <>
                  <Button variant="hr-outline" className="h-11 rounded-xl whitespace-nowrap" onClick={handleSaveDrafts} disabled={actionLoading || draftApps.length === 0}>
                    Save Draft adjustments
                  </Button>
                  <Button className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium whitespace-nowrap" onClick={handleSubmitToAccounts} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    Submit to Accounts
                  </Button>
                </>
              )}
              {payrollStatus === 'submitted' && (
                <Button variant="outline" className="h-11 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 whitespace-nowrap" onClick={handleReturnToDraft} disabled={actionLoading}>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Return to Draft
                </Button>
              )}
            </>
          )}

          {/* ACCOUNTANT / ADMIN VIEW ACTIONS */}
          {(currentUserRole === 'accountant' || currentUserRole === 'admin') && (
            <>
              {payrollStatus === 'submitted' && (
                <>
                  <Button variant="outline" className="h-11 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 whitespace-nowrap" onClick={handleReturnToDraft} disabled={actionLoading}>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Return to Draft
                  </Button>
                  <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium whitespace-nowrap" onClick={handleLock} disabled={actionLoading}>
                    <Lock className="w-5 h-5 mr-2" />
                    Review &amp; Lock
                  </Button>
                </>
              )}
              {payrollStatus === 'locked' && (
                <>
                  {slipStatus === 'none' && (
                    <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap" onClick={handleGenerateSlips} disabled={actionLoading}>
                      Generate Salary Slips
                    </Button>
                  )}
                  {slipStatus === 'generated' && (
                    <Button className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium whitespace-nowrap" onClick={handleReleaseSlips} disabled={actionLoading}>
                      Release Salary Slips
                    </Button>
                  )}
                  {paymentStatus === 'unpaid' && (
                    <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium whitespace-nowrap" onClick={handleOpenPaymentModal} disabled={actionLoading}>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Mark Paid
                    </Button>
                  )}
                  {paymentStatus !== 'paid' && (
                    <Button variant="outline" className="h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap" onClick={handleUnlock} disabled={actionLoading}>
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock Cycle
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* METADATA BADGES CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Workflow Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="flex items-center gap-2">
              <Badge className={`px-3 py-1 border-0 text-sm font-semibold capitalize ${
                payrollStatus === 'locked' ? 'bg-emerald-100 text-emerald-700' :
                payrollStatus === 'submitted' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {payrollStatus}
              </Badge>
              <span className="text-xs text-slate-400">Core Approval State</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Salary Slip Status</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="flex items-center gap-2">
              <Badge className={`px-3 py-1 border-0 text-sm font-semibold capitalize ${
                slipStatus === 'released' ? 'bg-emerald-100 text-emerald-700' :
                slipStatus === 'generated' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {slipStatus}
              </Badge>
              <span className="text-xs text-slate-400">Employee Access</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="flex items-center gap-2">
              <Badge className={`px-3 py-1 border-0 text-sm font-semibold capitalize ${
                paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {paymentStatus}
              </Badge>
              <span className="text-xs text-slate-400">Financial Execution</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FINANCE REVIEW SUMMARY CARD */}
      {(currentUserRole === 'accountant' || currentUserRole === 'admin') && payrollStatus === 'submitted' && (
        <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Finance Review Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase">Prepared By</div>
                <div className="text-sm font-bold mt-1">HR Manager</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase">Prepared On</div>
                <div className="text-sm font-bold mt-1">{cycle?.submitted_at ? new Date(cycle.submitted_at).toLocaleDateString() : 'Today'}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase">Employees</div>
                <div className="text-sm font-bold mt-1">{totalEmployees}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase">Gross Payroll</div>
                <div className="text-sm font-bold mt-1 text-slate-800">₹{grossPayroll.toLocaleString()}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase">Final Net Payroll</div>
                <div className="text-sm font-bold mt-1 text-indigo-600">₹{netPayroll.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Verification Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.keys(checklist).map((key) => (
                  <label key={key} className="flex items-center gap-2.5 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={(checklist as any)[key]} 
                      onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium capitalize text-slate-700">{key.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUMMARY DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{reviewedEmployees.size} / {data.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Employees</div>
          <div className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{totalEmployees}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Payroll</div>
          <div className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">₹{grossPayroll.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deductions</div>
          <div className="text-2xl font-bold text-red-500 mt-1">₹{totalDeductions.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Payable</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">₹{netPayroll.toLocaleString()}</div>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <div className="flex justify-between items-center w-full mb-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance Summary</TabsTrigger>
            <TabsTrigger value="adjustments">Payroll Adjustments</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="attendance" className="m-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Employee Snapshots
              </CardTitle>
              <div className="flex items-center gap-2">
                {isLocked && (
                  <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => setBulkOpen(true)}>
                    <Layers className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
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
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">Leaves</TableHead>
                        <TableHead className="text-right font-bold text-indigo-600 dark:text-indigo-400">Net Payable</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data && data.length > 0 ? (
                        liveData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              <div>{row.employee_name}</div>
                              <div className="text-xs text-slate-500">{row.department}</div>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{row.employee_id_external}</TableCell>
                            <TableCell className="text-right font-medium">₹{row.base_salary.toLocaleString()}</TableCell>
                            <TableCell className="text-center font-medium">
                              <span className="text-emerald-600">{row.days_present + row.days_field}</span><span className="text-slate-400 font-normal"> / 26</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-block text-left">
                                <span className="text-amber-600 font-medium" title="Paid Leave">{row.days_paid_leave} Paid</span><br/>
                                <span className="text-red-500 font-medium" title="Unpaid Leave">{row.days_unpaid_leave} Unpaid</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{row.net_payable.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked || fetchingUrl === row.id} title="View Salary Slip" onClick={() => handleViewSlip(row)}>
                                  {fetchingUrl === row.id ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <FileText className="w-4 h-4 text-slate-500" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isLocked || fetchingUrl === row.id + '-dl'} title="Download PDF" onClick={() => handleDownloadSlip(row)}>
                                  {fetchingUrl === row.id + '-dl' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Download className="w-4 h-4 text-blue-500" />}
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
        </TabsContent>

        <TabsContent value="adjustments" className="m-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                One-Time Adjustments &amp; Penalties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Gross Salary</TableHead>
                        <TableHead className="text-right">Absent Ded.</TableHead>
                        <TableHead className="text-right">Pending Balance</TableHead>
                        <TableHead className="text-center w-32">Recovery</TableHead>
                        <TableHead className="text-center w-32">Bonus</TableHead>
                        <TableHead className="text-center w-32">Other Ded.</TableHead>
                        <TableHead className="text-center">Reviewed</TableHead>
                        <TableHead className="text-right font-bold">Net Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data && data.length > 0 ? (
                        data.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.employee_name}</TableCell>
                            <TableCell className="text-right">₹{row.gross_salary?.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-500">₹{(row.base_salary - row.net_payable).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenTimeline(row.employee_id, row.adjustments || [])}>
                              ₹{(row.adjustments?.filter((a:any) => a.adjustment_category === 'recoverable').reduce((s:number, a:any) => s + a.remaining_amount, 0) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Input type="number" defaultValue={row.salary_advance_recovery} disabled={isLocked} className="h-8 w-24 mx-auto text-right" onChange={(e) => handleUpdateDraft(row.employee_id, 'salary_advance', Number(e.target.value))} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" defaultValue={row.adjustments?.find((a:any) => a.adjustment_type === 'bonus')?.applied_amount || 0} disabled={isLocked} className="h-8 w-24 mx-auto text-right" onChange={(e) => handleUpdateDraft(row.employee_id, 'bonus', Number(e.target.value))} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" defaultValue={row.other_deductions} disabled={isLocked} className="h-8 w-24 mx-auto text-right" onChange={(e) => handleUpdateDraft(row.employee_id, 'other_deduction', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="text-center">
                              <input 
                                type="checkbox" 
                                checked={reviewedEmployees.has(row.employee_id)} 
                                onChange={() => toggleReviewed(row.employee_id)}
                                disabled={isLocked} 
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:cursor-not-allowed" 
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-indigo-600">₹{row.live_net?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={9} className="text-center h-24">No employees found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS & MODALS */}

      {/* Salary Slip Preview Dialog */}
      <SalarySlipPreviewDialog 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        employeeName={selectedEmployee?.name || ''} 
        pdfUrl={selectedEmployee?.url} 
      />

      {/* Share Salary Slip Dialog */}
      {selectedEmployee && (
        <ShareSalarySlipDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          snapshotId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}

      {/* Lock Summary Modal */}
      <Dialog open={lockModalOpen} onOpenChange={setLockModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl border shadow-lg">
          <DialogHeader>
            <DialogTitle>Confirm Lock Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4 text-sm text-slate-600">
            <p>You are about to permanently lock and approve the payroll for <strong>{monthName} {year}</strong>.</p>
            <div className="bg-slate-50 p-4 rounded-xl border">
              <div className="flex justify-between py-1"><span>Total Employees:</span> <span className="font-semibold">{totalEmployees}</span></div>
              <div className="flex justify-between py-1"><span>Gross Payroll:</span> <span className="font-semibold">₹{grossPayroll.toLocaleString()}</span></div>
              <div className="flex justify-between py-1 border-t mt-2 pt-2 text-base font-bold"><span>Net Payable:</span> <span className="text-indigo-600">₹{netPayroll.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-slate-400">Locking will freeze calculations and post expense entries to the accounting ledger.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLockModalOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmLock}>Confirm &amp; Lock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Completion Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl border shadow-lg">
          <DialogHeader>
            <DialogTitle>Mark Payment Completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Company Funding Bank</label>
              <BankAccountSelector value={payBankId} onChange={setPayBankId} required showLabel={false} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Payment Date</label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-10 rounded-lg border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Payment Method</label>
                <Select value={payMethod} onValueChange={setPayMethod} placeholder="Method" className="h-10">
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Total Net Salary (Read-Only)</label>
              <div className="h-10 rounded-lg bg-slate-50 border flex items-center px-3 font-bold text-slate-800">
                ₹{netPayroll.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Payment Notes</label>
              <Input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Completed standard bank transfer run." className="h-10 rounded-lg border-slate-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleMarkPaymentCompleted}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Confirmation Modal */}
      <Dialog open={unlockModalOpen} onOpenChange={setUnlockModalOpen}>
        <DialogContent className="sm:max-w-md border-red-200 bg-white p-6 rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger: Unlock Payroll
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-4 text-sm text-slate-600">
            <p>Unlocking the payroll for <strong>{monthName} {year}</strong> will have the following effects:</p>
            <ul className="list-disc pl-5 space-y-1 font-medium">
              <li>Employee access to released salary slips will be revoked.</li>
              <li>The workflow status will revert to <strong>Draft</strong>.</li>
            </ul>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Reason for Unlocking</label>
              <textarea 
                className="w-full border rounded-xl p-2.5" 
                rows={2}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="E.g., Correction required for attendance records."
              ></textarea>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUnlockModalOpen(false)}>Cancel</Button>
            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={confirmUnlock} disabled={!unlockReason.trim()}>Unlock Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ledger Timeline Modal */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-lg">
          <DialogHeader className="p-0 mb-4 flex flex-row justify-between items-center space-y-0">
            <DialogTitle>Ledger Timeline</DialogTitle>
            <Button size="sm" variant={addLedgerOpen ? "outline" : "primary"} onClick={() => setAddLedgerOpen(!addLedgerOpen)}>
              {addLedgerOpen ? 'Cancel' : 'Add Entry'}
            </Button>
          </DialogHeader>

          {addLedgerOpen && (
            <form onSubmit={handleAddLedger} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-4 mb-4">
              <h3 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-200">New Ledger Entry</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Type</label>
                  <Select value={ledgerType} onValueChange={setLedgerType} placeholder="Select type" buttonClassName="h-9 bg-white dark:bg-slate-900">
                    <SelectItem value="salary_advance">Salary Advance</SelectItem>
                    <SelectItem value="damage">Damage Recovery</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="other_deduction">Other Deduction</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Amount (₹)</label>
                  <Input type="number" required min={1} className="w-full bg-white dark:bg-slate-900 h-9" value={ledgerAmount} onChange={e => setLedgerAmount(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Description</label>
                <Input type="text" required className="w-full bg-white dark:bg-slate-900 h-9" value={ledgerDesc} onChange={e => setLedgerDesc(e.target.value)} placeholder="e.g. Festival Advance" />
              </div>
              <Button type="submit" variant="hr" disabled={actionLoading} className="w-full mt-2 h-10">Save Entry</Button>
            </form>
          )}

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {selectedTimeline.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No timeline events recorded.</div>
            ) : (
              selectedTimeline.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">{item.adjustment_type?.replace('_', ' ').toUpperCase()}</div>
                      <time className="text-xs font-medium text-indigo-500">{item.status || 'Applied'}</time>
                    </div>
                    <div className="text-slate-500 text-sm">{item.description || 'No description'}</div>
                    <div className="mt-2 font-medium text-slate-800">Amount: ₹{item.applied_amount?.toLocaleString() || 0}</div>
                    {item.remaining_amount !== undefined && (
                      <div className="text-xs text-orange-600 font-bold mt-1">Remaining: ₹{item.remaining_amount.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Timeline Modal */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white p-6 rounded-2xl border shadow-lg">
          <DialogHeader>
            <DialogTitle>Audit Timeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 my-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {auditLogs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No audit logs recorded for this cycle.</div>
            ) : (
              auditLogs.map((item, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 shadow shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="font-bold text-slate-900">{item.action_type?.replace(/_/g, ' ').toUpperCase()}</div>
                      <time className="text-xs font-semibold text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      Action By: <span className="font-semibold text-slate-700">{item.profiles?.first_name} {item.profiles?.last_name} ({item.profiles?.role})</span>
                    </div>
                    <div className="text-slate-600 text-sm">{item.notes || 'Executed state transition.'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
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
