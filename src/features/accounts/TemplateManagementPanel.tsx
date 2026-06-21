"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle2, Copy, AlertCircle, Save, X, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getQuotationTemplatesAction, 
  saveQuotationTemplateAction, 
  deleteQuotationTemplateAction, 
  duplicateQuotationTemplateAction, 
  setDefaultQuotationTemplateAction 
} from "@/actions/quotation.actions";
import { cn } from "@/lib/utils";

export function TemplateManagementPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const loadTemplates = async () => {
    setLoading(true);
    const res = await getQuotationTemplatesAction();
    if (res.success) {
      setTemplates(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDuplicate = async (id: string) => {
    const res = await duplicateQuotationTemplateAction(id);
    if (res.success) {
      toast.success("Template duplicated");
      loadTemplates();
    } else {
      toast.error(res.error || "Failed to duplicate template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    const res = await deleteQuotationTemplateAction(id);
    if (res.success) {
      toast.success("Template deleted");
      loadTemplates();
    } else {
      toast.error(res.error || "Failed to delete template");
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await setDefaultQuotationTemplateAction(id);
    if (res.success) {
      toast.success("Default template updated");
      loadTemplates();
    } else {
      toast.error(res.error || "Failed to update default template");
    }
  };

  if (loading && !editingTemplate) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Loading templates...</p>
      </div>
    );
  }

  if (editingTemplate) {
    return (
      <TemplateEditor 
        template={editingTemplate} 
        onCancel={() => setEditingTemplate(null)} 
        onSave={() => { setEditingTemplate(null); loadTemplates(); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">T&C Templates</h2>
          <p className="text-xs text-slate-500 mt-1">Manage reusable terms and conditions for quotations.</p>
        </div>
        <button 
          onClick={() => setEditingTemplate({ name: "", category: "General", clauses: [] })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No templates found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {templates.map((t: any) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "glass-card p-5 space-y-4 flex flex-col relative overflow-hidden",
                  t.is_default && "border-indigo-500/30 dark:border-indigo-500/30"
                )}
              >
                {t.is_default && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
                    Default
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">{t.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.clauses?.length || 0} clauses</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setEditingTemplate(t)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(t.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!t.is_default && (
                    <button 
                      onClick={() => handleSetDefault(t.id)}
                      className="text-[10px] font-medium px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TemplateEditor({ template, onCancel, onSave }: { template: any, onCancel: () => void, onSave: () => void }) {
  const [name, setName] = useState(template.name || "");
  const [isDefault, setIsDefault] = useState(template.is_default || false);
  const [clauses, setClauses] = useState<any[]>(template.clauses ? JSON.parse(JSON.stringify(template.clauses)) : []);
  const [saving, setSaving] = useState(false);

  const addClause = () => setClauses([...clauses, { id: `cls-${Date.now()}`, title: "", content: "" }]);
  
  const updateClause = (idx: number, field: string, val: string) => {
    const newClauses = [...clauses];
    newClauses[idx] = { ...newClauses[idx], [field]: val };
    setClauses(newClauses);
  };
  
  const removeClause = (idx: number) => setClauses(clauses.filter((_, i) => i !== idx));

  const moveClause = (idx: number, dir: "up" | "down") => {
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === clauses.length - 1) return;
    const n = [...clauses];
    const t = dir === "up" ? idx - 1 : idx + 1;
    [n[idx], n[t]] = [n[t], n[idx]];
    setClauses(n);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Template name is required"); return; }
    
    setSaving(true);
    const res = await saveQuotationTemplateAction({
      id: template.id,
      name,
      is_default: isDefault,
      category: "General",
      clauses
    });

    if (res.success) {
      toast.success("Template saved successfully");
      onSave();
    } else {
      toast.error(res.error || "Failed to save template");
    }
    setSaving(false);
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {template.id ? "Edit Template" : "New Template"}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Template Name *</label>
          <input 
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Standard T&C 2026"
            className="flat-input w-full"
          />
        </div>
        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default template</span>
          </label>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Clauses</label>
          <button onClick={addClause} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium transition-colors">
            <Plus className="w-3 h-3" /> Add Clause
          </button>
        </div>

        {clauses.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 dark:border-white/20 rounded-xl">
            <p className="text-sm text-slate-500">No clauses added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clauses.map((clause, idx) => (
              <div key={clause.id || idx} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="shrink-0 w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    <input 
                      value={clause.title} onChange={e => updateClause(idx, "title", e.target.value)}
                      placeholder="Clause Title"
                      className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => moveClause(idx, "up")} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => moveClause(idx, "down")} disabled={idx === clauses.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                    <button onClick={() => removeClause(idx)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <textarea 
                    value={clause.content} onChange={e => updateClause(idx, "content", e.target.value)}
                    placeholder="Clause content..."
                    rows={3}
                    className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-y"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
