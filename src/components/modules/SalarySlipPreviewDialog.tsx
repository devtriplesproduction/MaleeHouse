"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Printer, Download } from "lucide-react";

interface SalarySlipPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  pdfUrl?: string | null;
  onRefreshUrl?: () => Promise<string | null>;
}

export function SalarySlipPreviewDialog({ open, onOpenChange, employeeName, pdfUrl, onRefreshUrl }: SalarySlipPreviewDialogProps) {
  
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const initUrl = async () => {
      if (!open || !pdfUrl) {
        if (isMounted) {
          setCurrentUrl(null);
          setError(null);
        }
        return;
      }
      
      let expired = false;
      try {
        const urlObj = new URL(pdfUrl);
        const token = urlObj.searchParams.get('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            expired = true;
          }
        }
      } catch (e) {}

      if (expired && onRefreshUrl) {
        setLoading(true);
        setError(null);
        try {
          const newUrl = await onRefreshUrl();
          if (isMounted) {
            if (newUrl) {
              setCurrentUrl(newUrl);
            } else {
              setError("Failed to regenerate salary slip URL.");
            }
          }
        } catch (err) {
          if (isMounted) setError("Failed to regenerate salary slip URL.");
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setCurrentUrl(pdfUrl);
          setError(null);
        }
      }
    };
    initUrl();
    return () => { isMounted = false; };
  }, [open, pdfUrl, onRefreshUrl]);

  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  
  const handlePrint = () => {
    if (currentUrl) {
      const printWin = window.open(currentUrl, '_blank');
      if (printWin) {
        printWin.focus();
        setTimeout(() => printWin.print(), 1000);
      }
    }
  };
  
  const handleDownload = () => {
    if (currentUrl) {
      const link = document.createElement('a');
      link.href = currentUrl;
      link.download = `Salary_Slip_${employeeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
          <DialogTitle>Salary Slip - {employeeName}</DialogTitle>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={!currentUrl || loading}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={!currentUrl || loading}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <Button variant="outline" size="icon" onClick={handlePrint} disabled={!currentUrl || loading}>
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="primary" className="gap-2" onClick={handleDownload} disabled={!currentUrl || loading}>
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4 flex justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
              <p>Refreshing secure URL...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 font-medium">
              {error}
            </div>
          ) : currentUrl ? (
            <div 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
              className="bg-white shadow-xl rounded-sm max-w-full h-full flex items-center justify-center min-w-[600px] overflow-hidden"
            >
              <iframe 
                src={currentUrl} 
                className="w-full h-full border-0 min-h-[800px]" 
                title="Salary Slip Preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No salary slip available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
