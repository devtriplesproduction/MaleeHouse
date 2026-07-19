"use client";
// Force HMR cache invalidation
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Mail, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateSignedSalarySlipUrlAction, markSalarySlipSharedAction } from "@/actions/payroll.actions";

interface ShareSalarySlipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotId: string;
  employeeName: string;
}

export function ShareSalarySlipDialog({ open, onOpenChange, snapshotId, employeeName }: ShareSalarySlipDialogProps) {
  const [loadingType, setLoadingType] = useState<'copy' | 'email' | 'whatsapp' | null>(null);

  const handleShare = async (method: 'copy' | 'email' | 'whatsapp') => {
    setLoadingType(method);
    
    try {
      // 1. Generate secure signed URL
      const res = await generateSignedSalarySlipUrlAction(snapshotId, 7 * 24 * 3600); // 7 days valid
      
      if (!res.success || !res.signedUrl) {
        toast.error(res.error || "Failed to generate secure link");
        return;
      }
      
      const secureUrl = res.signedUrl;

      // 2. Mark as shared in DB
      await markSalarySlipSharedAction(snapshotId);

      // 3. Execute sharing method
      if (method === 'copy') {
        await navigator.clipboard.writeText(`Salary Slip for ${employeeName}: ${secureUrl}`);
        toast.success("Secure link copied to clipboard");
      } else if (method === 'email') {
        const subject = encodeURIComponent(`Salary Slip - ${employeeName}`);
        const body = encodeURIComponent(`Hello ${employeeName},\n\nHere is your secure link to access your salary slip. This link is valid for 7 days:\n\n${secureUrl}\n\nBest regards,\nHR Department`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        toast.success("Email client opened");
      } else if (method === 'whatsapp') {
        const text = encodeURIComponent(`Hello ${employeeName}, here is the secure link to your salary slip (valid for 7 days): ${secureUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        toast.success("WhatsApp opened");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("An unexpected error occurred during sharing.");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Salary Slip</DialogTitle>
          <DialogDescription>
            Generate a secure, temporary link (valid for 7 days) to share with {employeeName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <Button 
            variant="outline" 
            className="justify-start gap-3 h-12" 
            onClick={() => handleShare('copy')}
            disabled={loadingType !== null}
          >
            {loadingType === 'copy' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5 text-indigo-500" />}
            Copy Secure Link
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start gap-3 h-12" 
            onClick={() => handleShare('email')}
            disabled={loadingType !== null}
          >
            {loadingType === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5 text-amber-500" />}
            Share via Email App
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start gap-3 h-12" 
            onClick={() => handleShare('whatsapp')}
            disabled={loadingType !== null}
          >
            {loadingType === 'whatsapp' ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5 text-emerald-500" />}
            Share via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
