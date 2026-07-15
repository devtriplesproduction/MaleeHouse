'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, Loader2, IndianRupee, FileText, Calendar, Building2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createExpenseAction, updateExpenseAction } from '@/actions/expense.actions';
import { uploadFileToServerAction } from '@/actions/storage.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ExpenseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[]; // Expecting id, name at least
  onSuccess?: () => void;
  defaultProjectId?: string;
  expenseToEdit?: any;
  initialCategory?: string;
}

export function ExpenseEntryModal({ isOpen, onClose, projects, onSuccess, defaultProjectId, expenseToEdit, initialCategory }: ExpenseEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    project_id: defaultProjectId || 'company-wide',
    category: initialCategory || '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  React.useEffect(() => {
    if (expenseToEdit && isOpen) {
      setFormData({
        project_id: expenseToEdit.project_id || defaultProjectId || 'company-wide',
        category: expenseToEdit.category || initialCategory || '',
        amount: expenseToEdit.amount?.toString() || '',
        expense_date: expenseToEdit.expense_date ? new Date(expenseToEdit.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: expenseToEdit.description || '',
      });
    } else if (!expenseToEdit && isOpen) {
      setFormData({
        project_id: defaultProjectId || 'company-wide',
        category: initialCategory || '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [expenseToEdit, isOpen, initialCategory, defaultProjectId]);
  
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
      
      let res;
      if (expenseToEdit) {
        res = await updateExpenseAction({
          id: expenseToEdit.id,
          project_id: formData.project_id === 'company-wide' ? undefined : formData.project_id,
          category: formData.category as any,
          amount: Number(formData.amount),
          expense_date: formData.expense_date,
          description: formData.description,
        });
      } else {
        res = await createExpenseAction(payload);
      }
      
      if (res.success) {
        toast({
          title: expenseToEdit ? "Expense Updated" : "Expense Recorded",
          description: expenseToEdit ? "The expense has been successfully updated." : "The expense has been successfully logged.",
          variant: "success"
        });
        if (onSuccess) onSuccess();
        onClose();
        // Reset form
        setFormData({
          project_id: defaultProjectId || 'company-wide',
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/40 shadow-2xl rounded-[1.5rem] sm:rounded-[2rem]">
        
        {/* Header */}
        <DialogHeader className="px-8 py-7 border-b border-border/30 flex flex-row items-center justify-between bg-card space-y-0 text-left">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold text-foreground tracking-tight">Record Expense</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
                Log a new business expense or transaction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-card/30">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Select */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <label className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-2 transition-colors",
                  focusedField === 'project' ? "text-primary" : "text-muted-foreground"
                )}>
                  <Building2 className="w-4 h-4" /> Project Allocation
                </label>
                <select
                  value={formData.project_id}
                  onFocus={() => setFocusedField('project')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground appearance-none cursor-pointer hover:border-border/80"
                >
                  <option value="company-wide">🏢 Company-wide (Overhead/General)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-2 transition-colors",
                  focusedField === 'category' ? "text-primary" : "text-muted-foreground"
                )}>
                  <Tag className="w-4 h-4" /> Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.category}
                  onFocus={() => setFocusedField('category')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground appearance-none cursor-pointer hover:border-border/80"
                  required
                >
                  <option value="" disabled>Select category...</option>
                  <option value="Travelling (Petrol)(Per 50Km)">Travelling (Petrol)(Per 50Km)</option>
                  <option value="Accomodation">Accomodation</option>
                  <option value="Food & Breakfast">Food & Breakfast</option>
                  <option value="Vehicle Maintance">Vehicle Maintance</option>
                  <option value="Paint">Paint</option>
                  <option value="Fakki">Fakki</option>
                  <option value="Other Field Expences">Other Field Expences</option>
                  <option value="Other Designing Expences">Other Designing Expences</option>
                  <option value="Other Submission Exp">Other Submission Exp</option>
                  <option value="Submission Travel">Submission Travel</option>
                  <option value="Equipment Rent (DGPS)">Equipment Rent (DGPS)</option>
                  <option value="Equipment Rent (Drone)">Equipment Rent (Drone)</option>
                  <option value="Equipment Rent (Lidar)">Equipment Rent (Lidar)</option>
                  <option value="Data Processing Cost (DGPS)">Data Processing Cost (DGPS)</option>
                  <option value="Data Processing Cost(Drone)">Data Processing Cost(Drone)</option>
                  <option value="Data Processing Cost (Lidar)">Data Processing Cost (Lidar)</option>
                  <option value="Computer Cost">Computer Cost</option>
                  <option value="Auto Cad License">Auto Cad License</option>
                  <option value="Printing/Xerox">Printing/Xerox</option>
                  <option value="Stationary">Stationary</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-2 transition-colors",
                  focusedField === 'amount' ? "text-primary" : "text-muted-foreground"
                )}>
                  <IndianRupee className="w-4 h-4" /> Amount <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className={cn(
                    "absolute left-5 top-1/2 -translate-y-1/2 font-medium transition-colors",
                    focusedField === 'amount' ? "text-primary" : "text-muted-foreground"
                  )}>₹</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-9 pr-5 py-4 bg-background border border-border/60 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground hover:border-border/80"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className={cn(
                "text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-2 transition-colors",
                focusedField === 'date' ? "text-primary" : "text-muted-foreground"
              )}>
                <Calendar className="w-4 h-4" /> Expense Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground hover:border-border/80"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className={cn(
                "text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-2 transition-colors",
                focusedField === 'description' ? "text-primary" : "text-muted-foreground"
              )}>
                <FileText className="w-4 h-4" /> Description <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="What was this expense for? Add details like vendor, purpose, etc."
                value={formData.description}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground min-h-[120px] resize-none hover:border-border/80"
                required
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Receipt Document (Optional)
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
                  className="w-full px-6 py-10 bg-muted/20 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted/40 hover:border-primary/50 transition-all group outline-none focus:ring-4 focus:ring-primary/10"
                >
                  <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Click to upload receipt</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports PDF, JPG, or PNG (max. 50MB)</p>
                  </div>
                </button>
              ) : (
                <div className="p-4 bg-background border border-border/80 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-8 py-6 border-t border-border/30 bg-card flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3.5 bg-transparent text-foreground hover:bg-muted/50 rounded-xl font-semibold text-sm transition-all focus:ring-4 focus:ring-muted outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="expense-form"
            disabled={!isFormValid || isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 focus:ring-4 focus:ring-primary/30 outline-none active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSubmitting ? 'Saving Expense...' : 'Save Expense'}
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
