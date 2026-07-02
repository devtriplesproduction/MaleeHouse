'use client';

import React, { useState, useEffect } from 'react';
  FileText, Plus, Trash2, Copy, Star, CheckCircle, Search, 
  ArrowUp, ArrowDown, LayoutGrid, Edit3, X, Save, HelpCircle, AlertCircle, Eye
} from 'lucide-react';
import { 
  getQuotationTemplatesAction, 
  saveQuotationTemplateAction, 
  deleteQuotationTemplateAction, 
  duplicateQuotationTemplateAction, 
  setDefaultQuotationTemplateAction 
} from '@/actions/quotation.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Survey Projects',
  'LiDAR Projects',
  'CAD Services',
  'Drone Survey',
  'Government Contracts',
  'Standard Commercial',
  'Custom'
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await getQuotationTemplatesAction();
    if (res.success) {
      setTemplates(res.data || []);
    } else {
      toast.error('Failed to load templates', { description: res.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      category: 'Survey Projects',
      is_default: false,
      clauses: [
        { id: `cls-${Date.now()}-1`, title: 'Payment Schedule', content: '50% advance, 50% upon completion.', display_order: 1 }
      ]
    });
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to duplicate this template?')) return;
    const res = await duplicateQuotationTemplateAction(id);
    if (res.success) {
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } else {
      toast.error('Duplicate failed', { description: res.error });
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await setDefaultQuotationTemplateAction(id);
    if (res.success) {
      toast.success('Default template updated');
      fetchTemplates();
    } else {
      toast.error('Failed to set default', { description: res.error });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    const res = await deleteQuotationTemplateAction(id);
    if (res.success) {
      toast.success('Template deleted');
      if (editingTemplate?.id === id) setEditingTemplate(null);
      fetchTemplates();
    } else {
      toast.error('Delete failed', { description: res.error });
    }
  };

  const handleSave = async () => {
    if (!editingTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (editingTemplate.clauses.length === 0) {
      toast.error('At least one clause is required');
      return;
    }
    if (editingTemplate.clauses.some((c: any) => !c.title.trim() || !c.content.trim())) {
      toast.error('All clauses must have a title and content');
      return;
    }

    const res = await saveQuotationTemplateAction(editingTemplate);
    if (res.success) {
      toast.success(editingTemplate.id ? 'Template updated' : 'Template created');
      setEditingTemplate(null);
      fetchTemplates();
    } else {
      toast.error('Failed to save template', { description: res.error });
    }
  };

  const addClause = () => {
    const nextOrder = editingTemplate.clauses.length + 1;
    setEditingTemplate((prev: any) => ({
      ...prev,
      clauses: [
        ...prev.clauses,
        { id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, title: '', content: '', display_order: nextOrder }
      ]
    }));
  };

  const removeClause = (index: number) => {
    setEditingTemplate((prev: any) => {
      const updatedClauses = prev.clauses.filter((_: any, i: number) => i !== index);
      // Re-assign display_order
      return {
        ...prev,
        clauses: updatedClauses.map((c: any, i: number) => ({ ...c, display_order: i + 1 }))
      };
    });
  };

  const updateClause = (index: number, field: string, value: any) => {
    setEditingTemplate((prev: any) => {
      const clauses = [...prev.clauses];
      clauses[index] = { ...clauses[index], [field]: value };
      return { ...prev, clauses };
    });
  };

  const moveClause = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingTemplate.clauses.length - 1) return;

    setEditingTemplate((prev: any) => {
      const clauses = [...prev.clauses];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = clauses[index];
      clauses[index] = clauses[targetIndex];
      clauses[targetIndex] = temp;

      return {
        ...prev,
        clauses: clauses.map((c, i) => ({ ...c, display_order: i + 1 }))
      };
    });
  };

  const filteredTemplates = templates.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || t.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview stats / header info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-6 rounded-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <FileText className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">T&C Template Manager</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Configure, refine and authorize default legal clauses</p>
          </div>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Templates list - Col 5 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-white/5 pb-4">
              <button 
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  activeTab === 'all' 
                    ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                All
              </button>
              {CATEGORIES.map((c: any) => (
                <button 
                  key={c}
                  onClick={() => setActiveTab(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                    activeTab === c 
                      ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {c.replace(' Projects', '').replace(' Survey', '')}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">No templates found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((t: any) => (
                  <div 
                    key={t.id}
                    onClick={() => setEditingTemplate(JSON.parse(JSON.stringify(t)))}
                    className={cn(
                      "p-4 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-start",
                      editingTemplate?.id === t.id 
                        ? "bg-indigo-500/5 border-indigo-500/40 shadow-lg" 
                        : "bg-slate-50/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.name}</h4>
                        {t.is_default && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-emerald-500" /> Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>{t.category}</span>
                        <span>•</span>
                        <span>{t.clauses?.length || 0} clauses</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleSetDefault(t.id, e)}
                        title="Make Default"
                        className={cn(
                          "p-2 rounded-xl border transition-all",
                          t.is_default 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-500 hover:border-amber-500/30"
                        )}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(JSON.parse(JSON.stringify(t)));
                        }}
                        title="View / Edit"
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDuplicate(t.id, e)}
                        title="Duplicate"
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(t.id, e)}
                        title="Delete"
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template editor - Col 7 */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {editingTemplate ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.01] blur-[80px] rounded-full" />
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      {editingTemplate.id ? 'Edit Template Specification' : 'Build Custom Template'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setEditingTemplate(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Title</label>
                    <input 
                      type="text" 
                      value={editingTemplate.name}
                      onChange={e => setEditingTemplate((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. DGPS Survey Standard Terms"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Category</label>
                    <select 
                      value={editingTemplate.category}
                      onChange={e => setEditingTemplate((prev: any) => ({ ...prev, category: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {CATEGORIES.map((c: any) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    id="is_default"
                    checked={editingTemplate.is_default || false}
                    onChange={e => setEditingTemplate((prev: any) => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_default" className="text-[11px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                    Set as system default for {editingTemplate.category}
                  </label>
                </div>

                {/* Clauses list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5" /> Clauses & Legal Exclusions ({editingTemplate.clauses?.length || 0})
                    </h4>
                    <button 
                      onClick={addClause}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Clause
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                    {editingTemplate.clauses?.map((clause: any, index: number) => (
                      <div 
                        key={clause.id || index}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[9px] font-black">
                            Clause #{index + 1}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => moveClause(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => moveClause(index, 'down')}
                              disabled={index === editingTemplate.clauses.length - 1}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => removeClause(index)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-slate-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <input 
                            type="text" 
                            value={clause.title}
                            onChange={e => updateClause(index, 'title', e.target.value)}
                            placeholder="Clause Header / Heading (e.g. Scope Limits)"
                            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                          />
                          <textarea 
                            value={clause.content}
                            onChange={e => updateClause(index, 'content', e.target.value)}
                            placeholder="Detailed clause description or legal statement..."
                            rows={3}
                            className="w-full p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save controls */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4">
                  <button 
                    onClick={() => setEditingTemplate(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Template
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-[550px] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <HelpCircle className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">No Active Specification</h4>
                <p className="text-xs text-slate-500 font-semibold max-w-sm leading-relaxed mb-6">
                  Select an existing T&C template from the registry to refine it, or click the button to build a brand new standard.
                </p>
                <button 
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Initialize Standard Template
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
