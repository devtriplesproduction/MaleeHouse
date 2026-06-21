'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createInvoiceAction } from '@/actions/finance.actions';
import { toast } from 'sonner';
import { FilePlus, Calculator, Info } from 'lucide-react';

interface CreateInvoiceModalProps {
  projectId: string;
  projectName: string;
  clientName: string;
  onSuccess?: () => void;
}

export function CreateInvoiceModal({ projectId, projectName, clientName, onSuccess }: CreateInvoiceModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    amount: 0,
    gst_rate: 18,
    notes: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createInvoiceAction({
        project_id: projectId,
        invoice_number: formData.invoice_number,
        amount: Number(formData.amount),
        gst_rate: Number(formData.gst_rate),
        notes: formData.notes,
        due_date: formData.due_date
      });

      if (result.success) {
        toast.success('Invoice created successfully');
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const gstAmount = (formData.amount * formData.gst_rate) / 100;
  const totalAmount = Number(formData.amount) + gstAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
          <FilePlus className="w-4 h-4" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            Generate Invoice
          </DialogTitle>
          <div className="text-sm text-slate-400 mt-2">
            Creating invoice for <span className="text-white font-bold">{projectName}</span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Invoice Number</label>
              <Input 
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Due Date</label>
              <Input 
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Base Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
              <Input 
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                className="bg-white/5 border-white/10 pl-10"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Subtotal</span>
              <span>INR {formData.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>GST ({formData.gst_rate}%)</span>
              <span>INR {gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black text-white">
              <span>Total Amount</span>
              <span className="text-amber-500">INR {totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes (Optional)</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Payment terms, bank details, etc."
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || formData.amount <= 0}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8"
            >
              {loading ? 'Generating...' : 'Confirm & Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
