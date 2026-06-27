'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, Loader2, IndianRupee, FileText, Calendar, Building2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createExpenseAction } from '@/actions/expense.actions';
import { uploadFileToServerAction } from '@/actions/storage.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ExpenseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[]; // Expecting id, name at least
  onSuccess?: () => void;
}

export function ExpenseEntryModal({ isOpen, onClose, projects, onSuccess }: ExpenseEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: 'company-wide',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum size is 50MB", variant: "error" });
        return;
      }
      setFile(selected);
    }
  };

  const isFormValid = formData.category && formData.amount && Number(formData.amount) > 0 && formData.expense_date && formData.description.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    try {
      let receipt_url = undefined;
      
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        const uploadRes = await uploadFileToServerAction(uploadData, formData.project_id);
        if (!uploadRes.success || !uploadRes.data) {
          throw new Error(uploadRes.error || "Failed to upload receipt.");
        }
        receipt_url = uploadRes.data.publicUrl;
      }
      
      const payload = {
        project_id: formData.project_id === 'company-wide' ? undefined : formData.project_id,
        category: formData.category as any,
        amount: Number(formData.amount),
        expense_date: formData.expense_date,
        description: formData.description,
        receipt_url
      };
      
      const res = await createExpenseAction(payload);
      
      if (res.success) {
        toast({
          title: "Expense Recorded",
          description: "The expense has been successfully logged.",
          variant: "success"
        });
        if (onSuccess) onSuccess();
        onClose();
        // Reset form
        setFormData({
          project_id: 'company-wide',
          category: '',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
          description: '',
        });
        setFile(null);
      } else {
        throw new Error(res.error || "Failed to create expense.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-[#0a0d16] border-slate-200/50 dark:border-white/10">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] space-y-0 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Record Expense</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">Add a new expense entry</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Select */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Project
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
              >
                <option value="company-wide">🏢 Company-wide (Overhead/General)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select category...</option>
                  <option value="labor">Labor</option>
                  <option value="material">Material</option>
                  <option value="travel">Travel</option>
                  <option value="overhead">Overhead</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5" /> Amount *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Expense Date *
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Description *
              </label>
              <textarea
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white min-h-[100px] resize-none"
                required
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" /> Receipt (Optional)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
              />
              
              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload receipt</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, JPG, or PNG (max. 50MB)</p>
                  </div>
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200/50 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0d16] flex items-center justify-end gap-3 shrink-0 sm:justify-end">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="expense-form"
            disabled={!isFormValid || isSubmitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
