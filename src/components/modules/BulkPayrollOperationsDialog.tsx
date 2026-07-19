"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Mail, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { emailSalarySlipAction, getSalarySlipsStatusAction } from "@/actions/payroll.actions";
import JSZip from "jszip";

interface SnapshotData {
  id: string;
  employee_id: string;
  employee_name: string;
  cycle_id: string;
}

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshots: SnapshotData[];
  month: number;
  year: number;
  getPdfUrl: (empId: string) => string;
}

export function BulkPayrollOperationsDialog({ 
  open, 
  onOpenChange, 
  snapshots, 
  month, 
  year, 
  getPdfUrl 
}: BulkOperationsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  
  const [slipsStatus, setSlipsStatus] = useState<any[]>([]);

  useEffect(() => {
    if (open && snapshots.length > 0 && snapshots[0].cycle_id) {
      loadStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, snapshots]);

  const loadStatus = async () => {
    const cycleId = snapshots[0].cycle_id;
    if (!cycleId || cycleId === 'draft-cycle') return;
    const res = await getSalarySlipsStatusAction(cycleId);
    if (res.success && res.data) {
      setSlipsStatus(res.data);
    }
  };

  const resetProgress = (taskName: string, totalItems: number) => {
    setCurrentTask(taskName);
    setProgress(0);
    setTotal(totalItems);
    setSuccessCount(0);
    setFailCount(0);
    setLoading(true);
  };

  const handleDownloadZip = async () => {
    if (snapshots.length === 0) return;
    resetProgress("Downloading PDFs...", snapshots.length);
    
    try {
      const zip = new JSZip();
      let s = 0;
      let f = 0;

      for (let i = 0; i < snapshots.length; i++) {
        const snap = snapshots[i];
        const url = getPdfUrl(snap.employee_id);
        
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Network error");
          const blob = await response.blob();
          const safeName = snap.employee_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          zip.file(`Salary_Slip_${safeName}_${month}_${year}.pdf`, blob);
          s++;
        } catch (e) {
          f++;
        }
        
        setProgress(i + 1);
        setSuccessCount(s);
        setFailCount(f);
      }

      setCurrentTask("Generating ZIP file...");
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Salary_Slips_${month}_${year}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("ZIP downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate ZIP");
    }

    setLoading(false);
    setCurrentTask(null);
  };

  const handleEmailAll = async (retryFailedOnly: boolean = false) => {
    if (snapshots.length === 0) return;
    
    let targets = snapshots;
    if (retryFailedOnly) {
      const emailedIds = new Set(slipsStatus.filter(s => s.emailed).map(s => s.snapshot_id));
      targets = snapshots.filter(s => !emailedIds.has(s.id));
    }

    if (targets.length === 0) {
      toast.info("No salary slips need emailing.");
      return;
    }

    resetProgress(retryFailedOnly ? "Retrying Failed Emails..." : "Emailing All Employees...", targets.length);
    
    let s = 0;
    let f = 0;

    for (let i = 0; i < targets.length; i++) {
      const snap = targets[i];
      const res = await emailSalarySlipAction(snap.id);
      if (res.success) {
        s++;
      } else {
        f++;
      }
      setProgress(i + 1);
      setSuccessCount(s);
      setFailCount(f);
    }
    
    toast.success(`Completed emailing. ${s} successful, ${f} failed.`);
    await loadStatus(); // refresh status
    setLoading(false);
    setCurrentTask(null);
  };

  const hasFailedEmails = slipsStatus.some(s => !s.emailed);
  const emailedCount = slipsStatus.filter(s => s.emailed).length;

  return (
    <Dialog open={open} onOpenChange={!loading ? onOpenChange : () => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Process all salary slips for {month}/{year}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-2">
          {currentTask ? (
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                {currentTask}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress / total) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Progress: {progress} / {total}</span>
                <span className="flex gap-3">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {successCount}</span>
                  <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3"/> {failCount}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                <span>Total Employees: <strong>{snapshots.length}</strong></span>
                {slipsStatus.length > 0 && <span>Emailed: <strong>{emailedCount}/{snapshots.length}</strong></span>}
              </div>

              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12" 
                onClick={handleDownloadZip}
              >
                <Download className="w-5 h-5 text-blue-500" />
                Download All as ZIP
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12" 
                onClick={() => handleEmailAll(false)}
              >
                <Mail className="w-5 h-5 text-amber-500" />
                Email All Employees
              </Button>
              
              {hasFailedEmails && (
                <Button 
                  variant="outline" 
                  className="justify-start gap-3 h-12 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20" 
                  onClick={() => handleEmailAll(true)}
                >
                  <RefreshCw className="w-5 h-5 text-red-500" />
                  Retry Failed Emails ({snapshots.length - emailedCount})
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
