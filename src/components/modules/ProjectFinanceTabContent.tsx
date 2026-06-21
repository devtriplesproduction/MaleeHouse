'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  UserPlus, 
  Send, 
  AlertTriangle, 
  Unlock, 
  Lock, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import { assignAccountantAction, createMilestonesAction, freezeProjectAction, unfreezeProjectAction } from '@/actions/finance.actions';
import { createInvoiceAction } from '@/actions/finance.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  due_date?: string;
  linked_stage?: string;
  is_activation_gate: boolean;
  status: 'pending' | 'invoice_generated' | 'sent' | 'paid' | 'overdue';
}

interface Visit {
  id: string;
  visit_date: string;
  completed_at?: string;
  status: 'scheduled' | 'completed' | 'invoice_generated' | 'paid' | 'cancelled';
  reported_by: string;
  description?: string;
}

interface ProjectFinanceTabContentProps {
  projectId: string;
  project: any;
  milestones: Milestone[];
  visits: Visit[];
  accountantOwner: any;
  role: string;
  theme: any;
  quotation?: any; // The active quotation with client token
  activityLogs?: any[];
}

// Mock Accountant list for assignment in Local JSON DB mode
const MOCK_ACCOUNTANTS = [
  { id: 'ba635e03-0a19-4267-b5d8-bfa422aeb250', name: 'Rohan Sharma', email: 'rohan.sharma@maleehouse.in' },
  { id: 'ac01b2cd-3e4f-5a6b-7c8d-9e0f1a2b3c4d', name: 'Priya Iyer', email: 'priya.iyer@maleehouse.in' },
  { id: 'ba742e03-0a20-4389-c6e8-bfa533aeb360', name: 'Vikram Malhotra', email: 'vikram.m@maleehouse.in' }
];

const STAGE_LABELS: Record<string, string> = {
  lead_created: 'Lead Created',
  quotation_requested: 'Quotation Requested',
  quotation_sent: 'Quotation Sent',
  payment_pending: 'Payment Pending',
  payment_done: 'Payment Done',
  project_created: 'Project Created',
  data_collection: 'Data Collection',
  prototype: 'CAD Prototype',
  review: 'Technical Review',
  field_work: 'Field Work',
  data_sync: 'Data Sync',
  final_review: 'QC Review',
  completed: 'Completed',
  archived: 'Archived'
};

export function ProjectFinanceTabContent({
  projectId,
  project,
  milestones,
  visits,
  accountantOwner,
  role,
  theme,
  quotation,
  activityLogs = []
}: ProjectFinanceTabContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Assignment State
  const [selectedAccountant, setSelectedAccountant] = useState(accountantOwner?.accountant_id || '');
  
  // Milestone Form State
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneItems, setMilestoneItems] = useState<Array<{
    title: string;
    description: string;
    amount: string;
    due_date: string;
    linked_stage: string;
    is_activation_gate: boolean;
  }>>([
    { title: 'Advance Staking Payment', description: '50% initial mobilization fee', amount: '', due_date: '', linked_stage: 'project_created', is_activation_gate: true }
  ]);

  // Freeze Modal State
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState<'payment_pending' | 'financial_hold' | 'client_issue' | 'approval_issue' | 'manual_admin_hold'>('payment_pending');
  const [freezeComment, setFreezeComment] = useState('');

  const isAdmin = role === 'admin';
  const isAccountant = role === 'accountant' || role === 'admin';
  
  // Indian currency formatting helper (en-IN)
  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // 1. Accountant Assignment Submit
  const handleAssignAccountant = async () => {
    if (!selectedAccountant) {
      toast.error("Selection Required", { description: "Please select an accountant." });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await assignAccountantAction(projectId, selectedAccountant);
      if (res?.success) {
        toast.success("Accountant Assigned", { description: "Ownership successfully updated." });
      } else {
        toast.error("Assignment Failed", { description: res?.error });
      }
    } catch (err: any) {
      toast.error("Unexpected Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. WhatsApp Portal Message Dispatcher
  const handleSendWhatsAppMessage = () => {
    if (!quotation) {
      toast.error("Quotation Missing", { description: "Quotation must be drafted first." });
      return;
    }
    
    // Construct dynamic client proposal link
    const dynamicPortalLink = `${window.location.origin}/client-portal/${quotation.client_token || quotation.id}`;
    
    // Construct professional Indian Standard pre-filled message text
    const messageText = `Dear ${project.client_name},\n\nHope you are doing well!\n\nWe have prepared our formal Surveying Services Commercial Proposal for "${project.name}" under SACSACSAC SAC 9983 professional consulting. \n\nPlease review the item breakdown, GST (18%) details, and lock your approval securely using this WhatsApp Proposal link:\n👉 ${dynamicPortalLink}\n\nOnce approved, our Finance Team will build your custom payment milestones to activate the field crew.\n\nWarm Regards,\nMalee House Surveying Team`;

    // Zero-Cost Dispatch: Launch WhatsApp pre-filled text
    const clientPhone = project.client_contact ? project.client_contact.replace(/\D/g, '') : '';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(clientPhone)}&text=${encodeURIComponent(messageText)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("WhatsApp Portal Launched", { description: "Message draft successfully prepared in WhatsApp." });
  };

  // 3. Milestone Creation Submit
  const handleAddMilestoneItem = () => {
    setMilestoneItems([
      ...milestoneItems,
      { title: '', description: '', amount: '', due_date: '', linked_stage: '', is_activation_gate: false }
    ]);
  };

  const handleRemoveMilestoneItem = (idx: number) => {
    setMilestoneItems(milestoneItems.filter((_, i) => i !== idx));
  };

  const handleMilestoneFieldChange = (idx: number, field: string, val: any) => {
    const updated = [...milestoneItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setMilestoneItems(updated);
  };

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount sum maps to quote total if required
    const payload = milestoneItems.map((item: any) => ({
      title: item.title,
      description: item.description,
      amount: parseFloat(item.amount) || 0,
      due_date: item.due_date ? new Date(item.due_date).toISOString() : undefined,
      linked_stage: item.linked_stage || undefined,
      is_activation_gate: item.is_activation_gate
    }));

    if (payload.some((item: any) => !item.title || item.amount <= 0)) {
      toast.error("Validation Failed", { description: "All milestones require a valid title and positive amount." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createMilestonesAction(projectId, payload);
      if (res?.success) {
        toast.success("Milestones Structured", { description: "Custom payment milestone gates are active." });
        setShowMilestoneForm(false);
      } else {
        toast.error("Failed to Create", { description: res?.error });
      }
    } catch (err: any) {
      toast.error("Unexpected Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Invoicing triggers for Milestones/Visits
  const handleGenerateInvoice = async (targetId: string, type: 'milestone' | 'visit', title: string, amount: number) => {
    if (!confirm(`Generate tax invoice for "${title}" of ${formatRupee(amount)} + GST (18%)?`)) return;
    
    setIsSubmitting(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `INV-2026-${randomSuffix}`;

      const res = await createInvoiceAction({
        project_id: projectId,
        invoice_number: invoiceNo,
        amount: amount,
        gst_rate: 18,
        notes: `Milestone/Visit specific tax invoice.`,
        milestone_id: type === 'milestone' ? targetId : undefined,
        visit_id: type === 'visit' ? targetId : undefined
      });

      if (res?.success) {
        toast.success("Invoice Dispatched", { description: `Invoice ${invoiceNo} generated successfully.` });
      } else {
        toast.error("Invoice Generation Failed", { description: res?.error });
      }
    } catch (err: any) {
      toast.error("Unexpected Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Freeze & Unfreeze Submits (Manual, no auto-freeze as per Indian standards request)
  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await freezeProjectAction(projectId, freezeReason, freezeComment);
      if (res?.success) {
        toast.success("Project Locked", { description: "All technical departments blockades are active." });
        setShowFreezeModal(false);
      } else {
        toast.error("Action Failed", { description: res?.error });
      }
    } catch (err: any) {
      toast.error("Unexpected Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!confirm("Are you sure you want to lift this financial lock? Operations will resume immediately.")) return;
    setIsSubmitting(true);
    try {
      const res = await unfreezeProjectAction(projectId, "Outstanding cleared by client. Manual unfreeze.");
      if (res?.success) {
        toast.success("Project Unlocked", { description: "Full technical operations restored." });
      } else {
        toast.error("Action Failed", { description: res?.error });
      }
    } catch (err: any) {
      toast.error("Unexpected Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── Top Finance Actions Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Accountant Ownership Box (Admin Only) */}
        {isAdmin && (
          <div className="glass-card p-6 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Assign Accountant Owner
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Appoint the dedicated financial accountant responsible for verifying receipts, billing milestones, and setting up GST logs.
              </p>
            </div>
            
            <div className="mt-4 flex gap-2">
              <select
                value={selectedAccountant}
                onChange={(e) => setSelectedAccountant(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Accountant...</option>
                {MOCK_ACCOUNTANTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
              </select>
              <button
                onClick={handleAssignAccountant}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Zero-Cost Proposal Sharing Box */}
        <div className="glass-card p-6 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              WhatsApp Proposal Link
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dispatch a secure, pre-filled WhatsApp proposal link to the customer. Enables 100% free digital client approvals, changes, and jsPDF downloads.
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSendWhatsAppMessage}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition"
            >
              <Send className="w-4 h-4" />
              Send Proposal via WhatsApp (Free)
            </button>
          </div>
        </div>

        {/* Manual Freeze & Lockout Levers Box */}
        <div className="glass-card p-6 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Financial Lockout Control
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              If client milestone payments are unpaid or on financial hold, Accounts can manually freeze project operations. Blocks all technical CAD/Field progress.
            </p>
          </div>

          <div className="mt-4">
            {project.is_frozen ? (
              <button
                onClick={handleUnfreeze}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition"
              >
                <Unlock className="w-4 h-4" />
                Unblock Project Operations
              </button>
            ) : (
              <button
                onClick={() => setShowFreezeModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition"
              >
                <Lock className="w-4 h-4" />
                Freeze Project Operations
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Project Milestones Ledger ── */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Structured Payment Milestones</h3>
            <p className="text-xs text-slate-500 mt-1">Setup stage gates where technical completion requires verified Indian GST (18%) invoices.</p>
          </div>
          
          {isAccountant && milestones.length === 0 && !showMilestoneForm && (
            <button
              onClick={() => setShowMilestoneForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" /> Structure Milestones
            </button>
          )}
        </div>

        {/* Milestone Configuration Form Panel */}
        {showMilestoneForm && (
          <form onSubmit={handleMilestoneSubmit} className="p-6 bg-slate-950/60 rounded-3xl border border-slate-800 space-y-6 animate-in slide-in-from-top duration-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" /> Configure Milestone Schedule (INR, 18% GST Compliance)
            </h4>

            <div className="space-y-4">
              {milestoneItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-4 bg-slate-900/40 rounded-2xl border border-slate-850">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Milestone Title</label>
                    <input
                      type="text"
                      required
                      value={item.title}
                      onChange={(e) => handleMilestoneFieldChange(idx, 'title', e.target.value)}
                      placeholder="e.g., CAD Prototype Approval"
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Base Cost (INR)</label>
                    <input
                      type="number"
                      required
                      value={item.amount}
                      onChange={(e) => handleMilestoneFieldChange(idx, 'amount', e.target.value)}
                      placeholder="₹ Base cost"
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Due Date</label>
                    <input
                      type="date"
                      value={item.due_date}
                      onChange={(e) => handleMilestoneFieldChange(idx, 'due_date', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Linked Stage</label>
                    <select
                      value={item.linked_stage}
                      onChange={(e) => handleMilestoneFieldChange(idx, 'linked_stage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-300"
                    >
                      <option value="">None (Unrestricted)</option>
                      {Object.keys(STAGE_LABELS).map((stg: any) => (
                        <option key={stg} value={stg}>{STAGE_LABELS[stg]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 justify-between p-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`act-gate-${idx}`}
                        checked={item.is_activation_gate}
                        onChange={(e) => handleMilestoneFieldChange(idx, 'is_activation_gate', e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-blue-600 w-4 h-4 focus:ring-0"
                      />
                      <label htmlFor={`act-gate-${idx}`} className="text-xs font-bold text-slate-400 select-none">Activates</label>
                    </div>
                    {idx > 0 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMilestoneItem(idx)}
                        className="text-xs text-red-500 font-bold hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleAddMilestoneItem}
                className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400"
              >
                <Plus className="w-3.5 h-3.5" /> Add Milestone Item
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-blue-500/10"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Structure Payment Gates
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Milestones List Ledger */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-950/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-xs font-bold tracking-wider text-slate-400 border-b border-slate-850">
                <th className="p-4">Milestone Title</th>
                <th className="p-4">Base Cost</th>
                <th className="p-4">GST (18%)</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Stage Guard</th>
                <th className="p-4">Status</th>
                {isAccountant && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const cgst = (m.amount * 9) / 100;
                const sgst = (m.amount * 9) / 100;
                const gstAmount = cgst + sgst;
                const totalAmount = m.amount + gstAmount;

                return (
                  <tr key={m.id} className="border-b border-slate-850 hover:bg-slate-900/10 text-xs transition duration-200">
                    <td className="p-4">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        {m.is_activation_gate && (
                          <span title="Project Activation Milestone">
                            <Award className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        )}
                        {m.title}
                      </div>
                      {m.description && <span className="text-xs text-slate-500">{m.description}</span>}
                    </td>
                    <td className="p-4 nums font-bold text-slate-300">{formatRupee(m.amount)}</td>
                    <td className="p-4 nums text-slate-500">
                      <div>{formatRupee(gstAmount)}</div>
                      <div className="text-[8px] text-slate-600">(9% CGST + 9% SGST)</div>
                    </td>
                    <td className="p-4 nums font-bold text-blue-400">{formatRupee(totalAmount)}</td>
                    <td className="p-4 nums text-slate-400">
                      {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {m.linked_stage ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-semibold text-slate-400">
                          {STAGE_LABELS[m.linked_stage]}
                        </span>
                      ) : 'None'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest ${
                        m.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        m.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        m.status === 'invoice_generated' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {m.status.replace("_", " ")}
                      </span>
                    </td>
                    {isAccountant && (
                      <td className="p-4 text-right">
                        {m.status === 'pending' ? (
                          <button
                            onClick={() => handleGenerateInvoice(m.id, 'milestone', m.title, m.amount)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50"
                          >
                            Bill Milestone
                          </button>
                        ) : m.status === 'invoice_generated' ? (
                          <span className="text-xs text-slate-500 italic">Invoice Sent</span>
                        ) : m.status === 'paid' ? (
                          <span className="text-xs text-emerald-500 font-bold">Paid ✓</span>
                        ) : m.status === 'overdue' ? (
                          <div className="flex gap-2 justify-end">
                            <span className="text-xs text-red-500 font-bold self-center">Payment Overdue</span>
                          </div>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={isAccountant ? 8 : 7} className="p-8 text-center text-slate-500 italic">
                    No structure formulated yet. Standard Indian GST invoice schedules are ready to build.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Visit-Based Ledger Panel ── */}
      {project.billing_type === 'visit_based' && (
        <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-3xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Indian SAC 9983 Survey Visit Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">Rolling visits ledger. Invoiced per-visit at standard rates, guarding technical stage movements.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-xs font-bold tracking-wider text-slate-400 border-b border-slate-850">
                  <th className="p-4">Visit Date</th>
                  <th className="p-4">Field Task Log Details</th>
                  <th className="p-4">Completion Status</th>
                  <th className="p-4">Billing Status</th>
                  {isAccountant && <th className="p-4 text-right">Invoice Generation</th>}
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-slate-850 hover:bg-slate-900/10 text-xs transition duration-200">
                    <td className="p-4 nums font-bold text-slate-300">
                      {new Date(v.visit_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200">Logged by: Field Crew</div>
                      {v.description && <span className="text-xs text-slate-500">{v.description}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest ${
                        v.completed_at ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {v.completed_at ? 'Completed' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest ${
                        v.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        v.status === 'invoice_generated' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-855 text-slate-440 border border-slate-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {isAccountant && (
                      <td className="p-4 text-right">
                        {v.status === 'completed' ? (
                          <button
                            onClick={() => handleGenerateInvoice(v.id, 'visit', `Field Visit - ${new Date(v.visit_date).toLocaleDateString()}`, 15000)} // Standard visit cost ₹15,000 + GST
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50"
                          >
                            Bill Visit
                          </button>
                        ) : v.status === 'invoice_generated' ? (
                          <span className="text-xs text-slate-500 italic">Invoice Sent</span>
                        ) : v.status === 'paid' ? (
                          <span className="text-xs text-emerald-500 font-bold">Paid ✓</span>
                        ) : (
                          <span className="text-xs text-slate-550 italic">Scheduled</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={isAccountant ? 5 : 4} className="p-8 text-center text-slate-500 italic">
                      No visits recorded under this billing ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Manual Freeze Modal Panel ── */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" />
                Manual Operations Freeze
              </h3>
              <button 
                type="button" 
                onClick={() => setShowFreezeModal(false)}
                className="text-xs text-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Lockout Category</label>
                <select
                  value={freezeReason}
                  onChange={(e: any) => setFreezeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500"
                >
                  <option value="payment_pending">Payment Pending (Outstanding Milestones)</option>
                  <option value="financial_hold">General Financial Hold</option>
                  <option value="client_issue">Client Inactivity / Relationship Issue</option>
                  <option value="approval_issue">Regulatory / Approval Complication</option>
                  <option value="manual_admin_hold">Manual Administrator Override Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Explanatory Comments (Logs in Audit Trail)</label>
                <textarea
                  required
                  rows={3}
                  value={freezeComment}
                  onChange={(e) => setFreezeComment(e.target.value)}
                  placeholder="Specify milestone details, GST payment details, or override logs..."
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-red-500/10"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Apply Operations Freeze
              </button>
            </form>
          </div>
        </div>
      )}

    {/* ── Freeze History Panel ── */}
    <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 rounded-3xl space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Freeze & Lockout History</h3>
        <p className="text-xs text-slate-500 mt-1">Audit log of all manual and automated project lockouts applied or lifted.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-950/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 text-xs font-bold tracking-wider text-slate-400 border-b border-slate-850">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details / Reason</th>
              <th className="p-4">Comments</th>
            </tr>
          </thead>
          <tbody>
            {((activityLogs || []).filter((a: any) => ['PROJECT_FROZEN', 'PROJECT_UNFROZEN'].includes(a.action)).length > 0) ? (
              (activityLogs || [])
                .filter((a: any) => ['PROJECT_FROZEN', 'PROJECT_UNFROZEN'].includes(a.action))
                .map((h: any) => (
                  <tr key={h.id} className="border-b border-slate-850 hover:bg-slate-900/10 text-xs transition duration-200">
                    <td className="p-4 nums text-slate-400">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold tracking-widest",
                        h.action === 'PROJECT_FROZEN' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      )}>
                        {h.action === 'PROJECT_FROZEN' ? 'Locked / Frozen' : 'Unlocked / Active'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-350">
                      {h.details?.reason ? h.details.reason.replace('_', ' ').toUpperCase() : 'Manual Trigger'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {h.details?.comment || 'Hold action completed.'}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                  No financial lock history recorded for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}
