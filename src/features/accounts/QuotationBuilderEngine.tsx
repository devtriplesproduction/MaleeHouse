'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Calculator, FileText, ShieldCheck, Info,
  Save, X, Loader2, LayoutGrid, Receipt, RefreshCw, Scroll,
  ArrowUp, ArrowDown, Tag, Lock, Building2, User, Phone, Mail, MapPin, ChevronDown
} from 'lucide-react';
import { createQuotationAction, createQuotationRevisionAction, getQuotationTemplatesAction, saveQuotationTemplateAction } from '@/actions/quotation.actions';
import { getStaffMembersAction, getUserProfileAction } from '@/actions/auth.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Service catalogue ────────────────────────────────────────────────────────
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Topographical Survey': 'Full topographic survey with contour mapping',
  'Boundary Verification': 'Boundary demarcation and area verification',
  'Construction Staking': 'Layout grid and peg installation for construction',
  'Utility Locating': 'Underground utility detection and mapping',
  'As-Built Survey': 'Post-construction as-built documentation',
  'Drone Photogrammetry': 'Aerial orthomosaic and 3D point-cloud generation',
  'Bathymetric Mapping': 'Underwater depth survey of water bodies',
  'DGPS Survey': 'High-precision DGPS data collection',
  'CAD Drafting': 'Technical drawing and CAD deliverables',
  'Site Visit': 'On-site inspection and assessment',
  'Revision Charge': 'Additional revision cycle',
};
const ALL_PRESET_SERVICES = Object.keys(SERVICE_DESCRIPTIONS);

function serviceToLineItem(name: string) {
  return { service_name: name, description: SERVICE_DESCRIPTIONS[name] ?? '', quantity: 1, unit_price: 0, total: 0 };
}

function buildInitialItems(project: any, existingQuotation?: any) {
  if (existingQuotation?.items?.length) {
    return existingQuotation.items.map((item: any) => ({
      ...item,
      quantity: item.quantity ?? item.default_quantity ?? 1,
      unit_price: item.unit_price ?? item.default_unit_price ?? 0,
    }));
  }
  const projectServices: string[] = Array.isArray(project?.services) ? project.services : [];
  if (projectServices.length > 0) return projectServices.map(serviceToLineItem);
  return [{ service_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }];
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface QuotationBuilderEngineProps {
  project: any | null;
  existingQuotation?: any;
  onCancel: () => void;
  onSuccess: () => void;
  isRevision?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function QuotationBuilderEngine({
  project, existingQuotation, onCancel, onSuccess, isRevision,
}: QuotationBuilderEngineProps) {
  const router = useRouter();
  const isScratch = !project; // standalone quotation with no linked project

  // Client / company details (scratch mode only)
  const [clientDetails, setClientDetails] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    project_title: '',
  });

  const [loading, setLoading] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  // Line items
  const [items, setItems] = useState<any[]>(() => buildInitialItems(project, existingQuotation));

  // Discount
  const [discountPct, setDiscountPct] = useState<number>(existingQuotation?.discount_pct ?? 0);

  // Notes
  const [notes, setNotes] = useState(existingQuotation?.notes || '');
  const [internalNotes, setInternalNotes] = useState({
    margin_notes: existingQuotation?.internal_notes?.margin_notes || '',
    finance_notes: existingQuotation?.internal_notes?.finance_notes || '',
  });

  // Assignment
  const [assignedTo, setAssignedTo] = useState(existingQuotation?.assigned_to || '');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [staff, setStaff] = useState<any[]>([]);

  // Templates / clauses
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeClauses, setActiveClauses] = useState<any[]>(() =>
    existingQuotation?.terms
      ? [{ id: 'cls-exist', title: 'Terms & Conditions', content: existingQuotation.terms }]
      : []
  );

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Get current user to auto-assign
    getUserProfileAction().then(profile => {
      if (profile?.id) {
        setCurrentUserId(profile.id);
        // Only auto-assign if this is a new quotation (not a revision)
        if (!existingQuotation?.assigned_to) {
          setAssignedTo(profile.id);
        }
      }
    });

    // 2. Fetch staff list
    getStaffMembersAction().then(res => {
      if (res) setStaff(res.filter((s: any) => ['accountant', 'admin'].includes(s.role)));
    });

    // 3. Fetch templates
    getQuotationTemplatesAction().then(res => {
      if (res?.success) {
        setTemplates(res.data || []);
        if (!existingQuotation) {
          const defaultTpl = res.data?.find((t: any) => t.is_default);
          if (defaultTpl) {
            setSelectedTemplateId(defaultTpl.id);
            setActiveClauses(JSON.parse(JSON.stringify(defaultTpl.clauses)));
          }
        }
      }
    });
  }, [existingQuotation]);

  // ── Templates ───────────────────────────────────────────────────────────────
  const handleTemplateChange = (templateId: string) => {
    if (!templateId) return;
    const tpl = templates.find((t: any) => t.id === templateId);
    if (tpl) {
      const newClauses = JSON.parse(JSON.stringify(tpl.clauses)).map((c: any) => ({
        ...c,
        id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      }));
      setActiveClauses(prev => [...prev, ...newClauses]);
      toast.success(`Appended ${tpl.name} clauses`);
    }
    // Reset selection so another template can be chosen
    setSelectedTemplateId('');
  };

  const addCustomClause = () =>
    setActiveClauses(prev => [...prev, { id: `cls-custom-${Date.now()}`, title: '', content: '' }]);

  const updateClause = (idx: number, field: 'title' | 'content', val: string) =>
    setActiveClauses(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });

  const removeClause = (idx: number) =>
    setActiveClauses(prev => prev.filter((_, i) => i !== idx));

  const moveClause = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === activeClauses.length - 1) return;
    setActiveClauses(prev => {
      const n = [...prev];
      const t = dir === 'up' ? idx - 1 : idx + 1;
      [n[idx], n[t]] = [n[t], n[idx]];
      return n;
    });
  };

  const handleSaveAsTemplate = async () => {
    const templateName = window.prompt("Enter a name for the new template:");
    if (!templateName || !templateName.trim()) return;

    setLoading(true);
    const res = await saveQuotationTemplateAction({
      name: templateName.trim(),
      category: "General",
      is_default: false,
      clauses: activeClauses
    });

    if (res.success) {
      toast.success("Template saved successfully");
      getQuotationTemplatesAction().then(r => {
        if (r?.success) setTemplates(r.data || []);
      });
    } else {
      toast.error(res.error || "Failed to save template");
    }
    setLoading(false);
  };

  // ── Line items ──────────────────────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, { service_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(prev => prev.filter((_, idx) => idx !== i));

  const addPreset = (name: string) => {
    if (items.some((it: any) => it.service_name === name)) { toast.info(`"${name}" is already in the list.`); return; }
    setItems(prev => [...prev, serviceToLineItem(name)]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        n[index].total = (Number(n[index].quantity) || 0) * (Number(n[index].unit_price) || 0);
      }
      return n;
    });
  };

  // ── Financials ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s: any, i: any) => s + (i.total || 0), 0);
  const discountPctVal = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
  const discountAmt = (subtotal * discountPctVal) / 100;
  const afterDiscount = subtotal - discountAmt;
  const gstAmount = (afterDiscount * 18) / 100;
  const total = afterDiscount + gstAmount;
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (isScratch && !clientDetails.company_name.trim()) { toast.error('Company name is required.'); return; }
      if (isScratch && !clientDetails.project_title.trim()) { toast.error('Project / quotation title is required.'); return; }
      if (items.some((i: any) => !(i.service_name || i.name)?.trim())) { toast.error('All line items require a service name.'); return; }
      if (isRevision && !revisionReason.trim()) { toast.error('Revision reason is required.'); return; }

      setLoading(true);
      const compiledTerms = activeClauses.map((c: any) => `${(c.title || '').toUpperCase()}:\n${c.content || ''}`).join('\n\n');

      const payload = {
        project_id: project?.id ?? null,
        quotation_number: existingQuotation?.quotation_number || `QTN-${Date.now().toString().slice(-6)}`,
        ...(isScratch && { client_details: clientDetails }),
        items: items.map((i: any) => ({ ...i, total: Number(i.total) || 0 })),
        discount_pct: discountPctVal,
        discount_amount: discountAmt,
        subtotal,
        gst_rate: 18,
        gst_amount: gstAmount,
        total_amount: total,
        notes,
        terms: compiledTerms,
        clauses: activeClauses,
        assigned_to: assignedTo || undefined,
        internal_notes: {
          pricing_discussions: [],
          margin_notes: internalNotes.margin_notes,
          finance_notes: internalNotes.finance_notes,
        },
      };

      const res = isRevision && existingQuotation
        ? await createQuotationRevisionAction(existingQuotation.id, payload, revisionReason)
        : await createQuotationAction(payload);

      if (res.success) {
        toast.success(isRevision ? `Revision V${(existingQuotation.current_version || 1) + 1} created` : 'Quotation saved');
        if (project?.id) {
          window.location.assign(`/accounts/quotations?project=${project.id}&mode=manage`);
        } else {
          onSuccess();
        }
      } else {
        alert("Failed to save quotation! Reason: " + res.error);
        toast.error('Failed to save quotation', { description: res.error });
      }
    } catch (error: any) {
      alert("Unexpected error crashed the save function: " + error.message);
      toast.error('Unexpected error occurred', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Presets not yet in items
  const selectedNames = new Set(items.map((i: any) => i.service_name));
  const unusedPresets = ALL_PRESET_SERVICES.filter((s: any) => !selectedNames.has(s));

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isRevision ? 'Quotation Revision' : isScratch ? 'New Quotation' : 'Quotation Builder'}
              </h3>
              {isRevision && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-semibold flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" /> V{(existingQuotation?.current_version || 1) + 1}
                </span>
              )}
              {isScratch && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-semibold">
                  Standalone
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isScratch
                ? 'Fill in client details and build your quotation from scratch'
                : isRevision ? `Revising quotation for ${project.name}` : `New quotation for ${project.name}`}
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Company / Client Details (scratch mode only) ──────────────────── */}
      {isScratch && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Company &amp; Client Details</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Building2 className="w-3 h-3" /> Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                value={clientDetails.company_name}
                onChange={e => setClientDetails(d => ({ ...d, company_name: e.target.value }))}
                placeholder="e.g. Adani Ports and SEZ Ltd"
                className="flat-input h-9 text-sm"
              />
            </div>
            {/* Project / Quotation Title */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <FileText className="w-3 h-3" /> Quotation Title <span className="text-rose-400">*</span>
              </label>
              <input
                value={clientDetails.project_title}
                onChange={e => setClientDetails(d => ({ ...d, project_title: e.target.value }))}
                placeholder="e.g. Topographical Survey – Phase 1"
                className="flat-input h-9 text-sm"
              />
            </div>
            {/* Contact Person */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <User className="w-3 h-3" /> Contact Person
              </label>
              <input
                value={clientDetails.contact_person}
                onChange={e => setClientDetails(d => ({ ...d, contact_person: e.target.value }))}
                placeholder="Full name"
                className="flat-input h-9 text-sm"
              />
            </div>
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Phone className="w-3 h-3" /> Phone
              </label>
              <input
                value={clientDetails.phone}
                onChange={e => setClientDetails(d => ({ ...d, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="flat-input h-9 text-sm"
              />
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                value={clientDetails.email}
                onChange={e => setClientDetails(d => ({ ...d, email: e.target.value }))}
                placeholder="client@company.com"
                className="flat-input h-9 text-sm"
              />
            </div>
            {/* Address */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="w-3 h-3" /> Address
              </label>
              <input
                value={clientDetails.address}
                onChange={e => setClientDetails(d => ({ ...d, address: e.target.value }))}
                placeholder="City, State"
                className="flat-input h-9 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Revision reason ─────────────────────────────────────────────────── */}
      {isRevision && (
        <div className="glass-card p-4 space-y-2 border-amber-500/20">
          <label className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Revision Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={revisionReason}
            onChange={e => setRevisionReason(e.target.value)}
            placeholder="Describe what changed from the previous version…"
            rows={2}
            className="flat-input resize-none focus:border-amber-500 focus:ring-amber-500/10"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ═══════════════ LEFT COLUMN ══════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* Services pre-populated notice */}
          {!existingQuotation && Array.isArray(project?.services) && project.services.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Services selected during project creation have been pre-populated. Add pricing to each row.
              </p>
            </div>
          )}

          {/* Quick-add presets */}
          {unusedPresets.length > 0 && (
            <div className="glass-card p-4 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Add Service</p>
              <div className="flex flex-wrap gap-2">
                {unusedPresets.map((name: any) => (
                  <button key={name} onClick={() => addPreset(name)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                    <Plus className="w-3 h-3" /> {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Line Items</h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-semibold">{items.length}</span>
              </div>
              <button onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-medium transition-all">
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-3 px-1">
                <span className="col-span-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Service</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Qty</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rate (₹)</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Total</span>
                <span className="col-span-1" />
              </div>

              <AnimatePresence initial={false}>
                {items.map((item, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    className="grid grid-cols-12 gap-3 items-start p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-all">

                    <div className="col-span-5 space-y-1.5">
                      <input value={item.service_name} onChange={e => updateItem(idx, 'service_name', e.target.value)}
                        placeholder="Service name…" className="flat-input h-9 text-xs font-medium" />
                      <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                        placeholder="Description (optional)…"
                        className="w-full h-8 rounded-lg bg-transparent border-none px-3 text-[11px] text-slate-400 outline-none focus:text-slate-600 dark:focus:text-slate-300" />
                    </div>

                    <div className="col-span-2">
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="flat-input h-9 text-xs font-medium text-center no-spin" />
                    </div>

                    <div className="col-span-2">
                      <input type="number" min={0} value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                        placeholder="0" className="flat-input h-9 text-xs font-medium no-spin" />
                    </div>

                    <div className="col-span-2">
                      <div className="h-9 flex items-center justify-end px-3 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs nums font-semibold text-slate-700 dark:text-slate-200">
                        {fmt(Number(item.total))}
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center pt-1.5">
                      <button onClick={() => removeItem(idx)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Client notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Client Notes
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Payment terms, delivery schedule, quotation validity…"
              className="flat-input resize-none" />
          </div>

          {/* ── T&C Clause Builder ─────────────────────────────────────────── */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Terms &amp; Conditions
                </h4>
                {activeClauses.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-semibold">
                    {activeClauses.length} clause{activeClauses.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between w-40 h-8 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-xs text-slate-600 dark:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <span className="truncate mr-2">Append template…</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200", dropdownOpen && "rotate-180 text-indigo-500")} />
                  </button>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-48 z-50 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden"
                      >
                        <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                          {templates.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">No templates</div>
                          ) : (
                            templates.map((t: any) => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  handleTemplateChange(t.id);
                                  setDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                {t.name}
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={addCustomClause}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100 transition-all">
                  <Plus className="w-3 h-3" /> Add Clause
                </button>
                <button onClick={handleSaveAsTemplate} disabled={activeClauses.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-medium text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50">
                  <Save className="w-3 h-3" /> Save as Template
                </button>
              </div>
            </div>

            <div className="p-5">
              {activeClauses.length === 0 ? (
                <div className="py-8 text-center">
                  <Scroll className="w-8 h-8 text-slate-200 dark:text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No clauses loaded. Select a template or add a custom clause.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {activeClauses.map((clause, idx) => (
                      <motion.div key={clause.id || idx}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.02]">

                        {/* Clause header bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="shrink-0 w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={clause.title}
                              onChange={e => updateClause(idx, 'title', e.target.value)}
                              placeholder="Clause title…"
                              className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button onClick={() => moveClause(idx, 'up')} disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 transition-all">
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => moveClause(idx, 'down')} disabled={idx === activeClauses.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 transition-all">
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeClause(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Clause content — clearly visible */}
                        <div className="p-4 relative">
                          <textarea
                            value={clause.content}
                            onChange={e => updateClause(idx, 'content', e.target.value)}
                            placeholder="Enter clause details…"
                            rows={4}
                            maxLength={500}
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-2.5 pb-7 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 resize-y leading-relaxed transition-all"
                          />
                          <div className="absolute bottom-6 right-6 text-[10px] text-slate-400 font-medium pointer-events-none">
                            {clause.content?.length || 0}/500
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT SIDEBAR ════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">

          {/* Financial summary */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Financial Summary
              </h4>
            </div>

            {/* Subtotal row */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal</span>
                <span className="nums font-medium text-slate-700 dark:text-slate-200">₹{fmt(subtotal)}</span>
              </div>

              {/* Discount row */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-500" /> Discount
                </span>
                <span className={cn('nums font-medium', discountAmt > 0 ? 'text-emerald-600' : 'text-slate-400')}>
                  {discountAmt > 0 ? `−₹${fmt(discountAmt)}` : '—'}
                </span>
              </div>

              {discountAmt > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">After discount</span>
                  <span className="nums text-sm font-medium text-slate-700 dark:text-slate-200">₹{fmt(afterDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500">GST (18%)</span>
                <span className="nums font-medium text-slate-700 dark:text-slate-200">₹{fmt(gstAmount)}</span>
              </div>
            </div>

            {/* Grand total */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Grand Total</p>
              <p className="text-2xl font-bold nums text-slate-900 dark:text-white">
                <span className="text-sm text-slate-400 mr-1">INR</span>{fmt(total)}
              </p>
            </div>

            {/* Discount input */}
            <div className="pt-1 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Tag className="w-3 h-3" /> Discount
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* % input */}
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={discountPct === 0 ? '' : discountPct}
                    onChange={e => setDiscountPct(Number(e.target.value))}
                    placeholder="0"
                    className="flat-input h-9 text-sm font-medium pr-7 no-spin"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">%</span>
                </div>
                {/* Computed amount (read-only) */}
                <div className="relative">
                  <div className="h-9 flex items-center px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm nums font-medium text-emerald-600">
                    {discountAmt > 0 ? `−₹${fmt(discountAmt)}` : '₹0'}
                  </div>
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Enter % — discount amount is calculated automatically.</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">GST @ 18% is applied on the discounted amount.</p>
            </div>
          </div>

          {/* Internal Finance Audit */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Internal Finance Audit
              </h4>
            </div>

            <div className="space-y-3">
              {/* Assign accountant — auto-selected to current user */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Accountant
                </label>
                <div className="flat-input bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/65 dark:border-white/10 text-sm font-semibold py-2.5 px-3 rounded-lg text-slate-850 dark:text-slate-200">
                  {staff.find((s: any) => s.id === assignedTo)
                    ? `${staff.find((s: any) => s.id === assignedTo)?.first_name || ''} ${staff.find((s: any) => s.id === assignedTo)?.last_name || ''}`.trim()
                    : 'Unassigned'} {assignedTo === currentUserId ? '(You)' : ''}
                </div>
                {assignedTo === currentUserId && (
                  <p className="text-[10px] text-indigo-500 flex items-center gap-1 mt-1 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Auto-assigned to you as the creator
                  </p>
                )}
              </div>

              {/* Margin notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Margin Strategy</label>
                <textarea value={internalNotes.margin_notes}
                  onChange={e => setInternalNotes(n => ({ ...n, margin_notes: e.target.value }))}
                  rows={3} placeholder="Margin, outsourcing costs, sub-contractor rates…"
                  className="flat-input resize-none text-sm" />
              </div>

              {/* Finance notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Special Billing Logic</label>
                <textarea value={internalNotes.finance_notes}
                  onChange={e => setInternalNotes(n => ({ ...n, finance_notes: e.target.value }))}
                  rows={3} placeholder="Special billing terms, milestone-based release…"
                  className="flat-input resize-none text-sm" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isRevision ? 'Commit Revision' : 'Save Quotation'}
            </button>

            <button onClick={onCancel} disabled={loading}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-50">
              Cancel
            </button>

            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Authorized Financial Document</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
