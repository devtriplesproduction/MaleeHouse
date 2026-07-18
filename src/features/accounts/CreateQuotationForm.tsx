'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  Info,
  DollarSign,
  Save,
  Send,
  X,
  ArrowLeft,
  Loader2,
  ChevronDown,
  LayoutGrid,
  Percent,
  Receipt,
  Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuotationAction } from '@/actions/quotation.actions';
import { getStaffMembersAction } from '@/actions/auth.actions';
import { getBankAccountsAction } from '@/actions/bank.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateQuotationFormProps {
  project: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateQuotationForm({ project, onCancel, onSuccess }: CreateQuotationFormProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([
    { service_name: '', description: '', quantity: 1, unit_price: '', total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState({
    pricing_discussions: '',
    margin_notes: '',
    finance_notes: ''
  });
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [staff, setStaff] = useState<any[]>([]);
  const [gstType, setGstType] = useState<string>('CGST_SGST_18');
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');

  const STORAGE_KEY = `quotation_draft_${project?.id}`;

  // Load saved draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.items) setItems(parsed.items);
          if (parsed.notes !== undefined) setNotes(parsed.notes);
          if (parsed.internalNotes) setInternalNotes(parsed.internalNotes);
          if (parsed.assignedTo !== undefined) setAssignedTo(parsed.assignedTo);
          if (parsed.gstType) setGstType(parsed.gstType);
          if (parsed.selectedBank) setSelectedBank(parsed.selectedBank);
        } catch (e) {
          console.error('Failed to parse saved quotation draft', e);
        }
      }
    }
  }, [STORAGE_KEY]);

  // Save draft whenever form values change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = {
        items,
        notes,
        internalNotes,
        assignedTo,
        gstType,
        selectedBank
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [items, notes, internalNotes, assignedTo, gstType, selectedBank, STORAGE_KEY]);

  useEffect(() => {
    getStaffMembersAction().then(res => {
      if (res) {
        setStaff(res.filter((s: any) => s.role === 'accountant' || s.role === 'admin'));
      }
    });
    getBankAccountsAction().then(res => {
      if (res.success && res.data) {
        setBanks(res.data);
        const defaultBank = (res.data as any[]).find((b: any) => b.is_default);
        // Only set default bank if we don't have one loaded from the draft
        if (defaultBank && !selectedBank && !localStorage.getItem(STORAGE_KEY)?.includes('selectedBank')) {
          setSelectedBank(defaultBank.id);
        }
      }
    });
  }, [STORAGE_KEY, selectedBank]);

  const addItem = () => {
    setItems([...items, { service_name: '', description: '', quantity: 1, unit_price: '', total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      const qty = Number(newItems[index].quantity) || 0;
      const up = Number(newItems[index].unit_price) || 0;
      newItems[index].total = qty * up;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum: any, item: any) => sum + item.total, 0);
  const gstRate = gstType === 'NO_GST' ? 0 : (gstType.endsWith('_5') ? 5 : 18);
  const gstAmount = (subtotal * gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i: any) => !i.service_name)) {
      toast.error('Protocol Error', { description: 'All line items must have a service designation.' });
      return;
    }

    setLoading(true);
    try {
      const result = await createQuotationAction({
        project_id: project.id,
        quotation_number: `QTN-${Date.now().toString().slice(-6)}`,
        items: items.map((i: any) => ({ ...i, quantity: Number(i.quantity) || 0, unit_price: Number(i.unit_price) || 0, total: Number(i.total) })),
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        notes,
        assigned_to: assignedTo || undefined,
        bank_id: selectedBank || undefined,
        client_details: { gst_type: gstType.startsWith('CGST_SGST') ? 'CGST_SGST' : (gstType.startsWith('IGST') ? 'IGST' : 'NO_GST') },
        internal_notes: {
          pricing_discussions: [internalNotes.pricing_discussions],
          margin_notes: internalNotes.margin_notes,
          finance_notes: internalNotes.finance_notes
        }
      });

      if (result.success) {
        localStorage.removeItem(STORAGE_KEY);
        toast.success('Quotation Synchronized', {
          description: 'The financial draft has been successfully archived in the project ledger.'
        });
        onSuccess();
      } else {
        toast.error('Persistence Failed', { description: result.error });
      }
    } catch (error) {
      toast.error('System Exception', { description: 'Failed to commit quotation to core engine.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <Calculator className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Quotation <span className="text-amber-500">Builder</span></h3>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Alpha V2.0</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Configuring financial itemization for: <span className="text-indigo-500 font-bold tracking-tight uppercase">{project.name}</span></p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
          Abort Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Itemization Section ── */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass-card border-white/5 overflow-hidden rounded-[2.5rem] shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Itemization Ledger</h4>
              </div>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-[0.95]"
              >
                <Plus className="w-3 h-3" />
                Add Service Line
              </button>
            </div>
            
            <div className="p-8 space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-12 gap-4 items-end p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="col-span-5 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Service Designation</label>
                      <input 
                        placeholder="e.g. Topographical Data Collection"
                        value={item.service_name}
                        onChange={(e) => updateItem(index, 'service_name', e.target.value)}
                        className="glass-input h-12 text-sm font-bold"
                      />
                    </div>
                    <div className="col-span-2 space-y-2 text-center">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty</label>
                      <input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="glass-input h-12 text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unit Rate (INR)</label>
                      <input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="glass-input h-12 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-2 text-right">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Line Total</label>
                      <div className="h-12 flex items-center justify-end px-4 rounded-2xl bg-white/5 border border-white/5 nums text-xs font-bold text-slate-900 dark:text-white">
                        {item.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button 
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="col-span-12 pt-2">
                       <input 
                        placeholder="Detailed scope or geographical constraints..."
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full bg-transparent border-none text-[10px] font-medium text-slate-500 outline-none focus:text-indigo-400 transition-colors px-1"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Public Notes ── */}
          <div className="glass-card p-8 border-white/5 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Legal Terms & Notes</h4>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-40 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white resize-none"
              placeholder="Specify payment milestones, delivery duration, and quotation validity..."
            />
          </div>
        </div>

        {/* ── Sidebar: Calculations & Approval ── */}
        <div className="lg:col-span-4 space-y-8">
          {/* ── Financial Summary ── */}
          <div className="glass-card p-10 bg-indigo-600/[0.03] border-indigo-500/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Total Valuation</h4>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">GST Type</span>
                  <select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value)}
                    className="bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="CGST_SGST_18" className="bg-white dark:bg-slate-900">CGST & SGST (18%)</option>
                    <option value="IGST_18" className="bg-white dark:bg-slate-900">IGST (18%)</option>
                    <option value="CGST_SGST_5" className="bg-white dark:bg-slate-900">CGST & SGST (5%)</option>
                    <option value="IGST_5" className="bg-white dark:bg-slate-900">IGST (5%)</option>
                    <option value="NO_GST" className="bg-white dark:bg-slate-900">No GST (0%)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtotal</span>
                  <span className="nums text-sm font-bold text-slate-900 dark:text-white">INR {subtotal.toLocaleString('en-IN')}</span>
                </div>
                {gstType.startsWith('CGST_SGST') ? (
                  <>
                    <div className="flex justify-between items-center px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CGST</span>
                        <div className="px-2 py-0.5 rounded-md bg-indigo-500 text-[8px] font-black text-white">{gstRate / 2}%</div>
                      </div>
                      <span className="nums text-sm font-bold text-slate-900 dark:text-white">INR {(gstAmount / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SGST</span>
                        <div className="px-2 py-0.5 rounded-md bg-indigo-500 text-[8px] font-black text-white">{gstRate / 2}%</div>
                      </div>
                      <span className="nums text-sm font-bold text-slate-900 dark:text-white">INR {(gstAmount / 2).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {gstType.startsWith('IGST') ? 'IGST' : 'GST'}
                      </span>
                      <div className="px-2 py-0.5 rounded-md bg-indigo-500 text-[8px] font-black text-white">{gstRate}%</div>
                    </div>
                    <span className="nums text-sm font-bold text-slate-900 dark:text-white">INR {gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">Grand Total Projection</span>
                  <div className="text-4xl font-black text-slate-900 dark:text-white nums tracking-tighter">
                    <span className="text-amber-500 text-xl mr-2 font-bold uppercase tracking-tight">INR</span>
                    {totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                  Tax logic is calculated dynamically based on the selected GST type protocol.
                </p>
              </div>
            </div>
          </div>

          {/* ── Payment Details ── */}
          <div className="glass-card p-10 border-indigo-500/20 bg-indigo-500/[0.02] rounded-[2.5rem] space-y-8 shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Payment Details
            </h4>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Bank Account *</label>
              <div className="relative group">
                <select 
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-900">Select Bank Account...</option>
                  {banks.map((b: any) => (
                    <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {b.bank_name} - {b.account_number}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ── Internal Audit Notes ── */}
          <div className="glass-card p-10 border-emerald-500/20 bg-emerald-500/[0.02] rounded-[2.5rem] space-y-8 shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Internal Finance Audit
            </h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Assign Auditor</label>
                <div className="relative group">
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-slate-900">Select Accountant...</option>
                    {staff.map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 text-indigo-500" />
                    <span className="text-[11px] uppercase tracking-[0.2em]">Synchronize Quotation</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-2 px-4">
                 <ShieldCheck className="w-3 h-3 text-emerald-500" />
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Authorized Financial Transaction</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
