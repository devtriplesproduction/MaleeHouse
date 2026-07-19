"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, Search } from "lucide-react";
import { SalarySlipPreviewDialog } from "@/components/modules/SalarySlipPreviewDialog";
import { getSalarySlipUrlAction } from "@/actions/payroll.actions";

interface SalarySlipData {
  id: string;
  month: number;
  year: number;
  status: string;
  pdf_url: string | null;
  employee_id: string;
  snapshot_id: string;
  generated_at: string;
}

interface MySalaryClientProps {
  slips: SalarySlipData[];
  employeeName: string;
}

export function MySalaryClient({ slips, employeeName }: MySalaryClientProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipData | null>(null);

  const handleView = (slip: SalarySlipData) => {
    setSelectedSlip(slip);
    setPreviewOpen(true);
  };

  
  const handleRefreshUrl = async () => {
    if (!selectedSlip) return null;
    const res = await getSalarySlipUrlAction(selectedSlip.snapshot_id, selectedSlip.employee_id, selectedSlip.month, selectedSlip.year);
    if (res.success && res.url) {
      return res.url;
    }
    return null;
  };

  const getMonthName = (monthNum: number) => {
    return new Date(2000, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Salary Slips</h1>
          <p className="text-sm text-slate-500 mt-1">View and download your monthly salary slips.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Salary History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slips && slips.length > 0 ? (
                  slips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.month ? getMonthName(slip.month) : 'N/A'}</TableCell>
                      <TableCell>{slip.year || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          {slip.status || 'Generated'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View Salary Slip" disabled={!slip.pdf_url} onClick={() => handleView(slip)}>
                            <FileText className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF" onClick={async () => {
                             try {
                               const res = await getSalarySlipUrlAction(slip.snapshot_id, slip.employee_id, slip.month, slip.year);
                               if (res.success && res.url) {
                                 const link = document.createElement('a');
                                 link.href = res.url;
                                 link.download = `Salary_Slip_${employeeName.replace(/\s+/g, '_')}_${slip.month}_${slip.year}.pdf`;
                                 document.body.appendChild(link);
                                 link.click();
                                 document.body.removeChild(link);
                               } else {
                                 alert("Failed to download salary slip.");
                               }
                             } catch (e) {
                               alert("An error occurred while downloading.");
                             }
                           }}>
                            <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Print" onClick={async () => {
                             try {
                               const res = await getSalarySlipUrlAction(slip.snapshot_id, slip.employee_id, slip.month, slip.year);
                               if (res.success && res.url) {
                                 const printWin = window.open(res.url, '_blank');
                                 if (printWin) {
                                   printWin.focus();
                                   setTimeout(() => printWin.print(), 1000);
                                 }
                               } else {
                                 alert("Failed to load salary slip for printing.");
                               }
                             } catch (e) {
                               alert("An error occurred while printing.");
                             }
                           }}>
                            <Printer className="w-4 h-4 text-emerald-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No salary slips found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SalarySlipPreviewDialog 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        employeeName={employeeName} 
        pdfUrl={selectedSlip?.pdf_url} 
        onRefreshUrl={handleRefreshUrl}
      />
    </div>
  );
}
