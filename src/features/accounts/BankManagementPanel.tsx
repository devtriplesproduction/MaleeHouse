"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle2, AlertCircle, Save, X, Loader2, Landmark, CreditCard, Building2, Hash } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getBankAccountsAction, 
  saveBankAccountAction, 
  deleteBankAccountAction, 
  setDefaultBankAccountAction 
} from "@/actions/bank.actions";
import { cn } from "@/lib/utils";

export function BankManagementPanel() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBank, setEditingBank] = useState<any>(null);

  const loadBanks = async () => {
    setLoading(true);
    const res = await getBankAccountsAction();
    if (res.success) {
      setBanks(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    const res = await deleteBankAccountAction(id);
    if (res.success) {
      toast.success("Bank account deleted");
      loadBanks();
    } else {
      toast.error(res.error || "Failed to delete bank account");
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await setDefaultBankAccountAction(id);
    if (res.success) {
      toast.success("Default bank account updated");
      loadBanks();
    } else {
      toast.error(res.error || "Failed to update default bank account");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;

    if (!editingBank.bank_name || !editingBank.account_name || !editingBank.account_number || !editingBank.ifsc_code || !editingBank.branch_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    const res = await saveBankAccountAction(editingBank);
    if (res.success) {
      toast.success("Bank account saved successfully");
      setEditingBank(null);
      loadBanks();
    } else {
      toast.error(res.error || "Failed to save bank account");
    }
  };

  if (loading && banks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            Bank Accounts
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage your company's bank accounts for quotations and invoicing
          </p>
        </div>
        {!editingBank && (
          <button
            onClick={() => setEditingBank({ 
              bank_name: "", account_name: "", account_number: "", ifsc_code: "", branch_name: "", is_default: false 
            })}
            className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Add Bank Account</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editingBank ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 dark:bg-[#0c1222]/80 backdrop-blur-2xl shadow-2xl p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-slate-200/50 dark:border-white/10">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {editingBank.id ? "Edit Bank Account" : "New Bank Account"}
              </h3>
              <button
                onClick={() => setEditingBank(null)}
                className="p-2 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 text-indigo-500" /> Bank Name *
                  </label>
                  <input
                    type="text"
                    value={editingBank.bank_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, bank_name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> Account Name *
                  </label>
                  <input
                    type="text"
                    value={editingBank.account_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, account_name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                    placeholder="e.g. Malee House"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-indigo-500" /> Account Number *
                  </label>
                  <input
                    type="text"
                    value={editingBank.account_number || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, account_number: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm tracking-widest"
                    placeholder="e.g. 50200000000000"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-indigo-500" /> IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={editingBank.ifsc_code || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, ifsc_code: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm uppercase placeholder:normal-case"
                    placeholder="e.g. HDFC0001234"
                  />
                </div>

                <div className="space-y-2.5 md:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Branch Name *
                  </label>
                  <input
                    type="text"
                    value={editingBank.branch_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, branch_name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                    placeholder="e.g. MG Road Branch"
                  />
                </div>

                <div className="space-y-2.5 flex items-center md:col-span-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input
                        type="checkbox"
                        checked={editingBank.is_default || false}
                        onChange={(e) => setEditingBank({ ...editingBank, is_default: e.target.checked })}
                        className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:border-indigo-600 checked:bg-indigo-600 transition-all cursor-pointer"
                      />
                      <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Set as Default Bank Account
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-200/50 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="group relative flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <Save className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Save Bank Account</span>
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {banks.map((bank) => (
              <div
                key={bank.id}
                className={cn(
                  "relative group overflow-hidden rounded-3xl border transition-all duration-300 p-6 md:p-8",
                  bank.is_default 
                    ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 shadow-xl shadow-indigo-500/10" 
                    : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                {bank.is_default && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
                        bank.is_default 
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20" 
                          : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      )}>
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{bank.bank_name}</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {bank.branch_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!bank.is_default && (
                        <button
                          onClick={() => handleSetDefault(bank.id)}
                          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Set as Default"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingBank(bank)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 bg-white/50 dark:bg-black/20 rounded-2xl p-5 border border-slate-100 dark:border-white/5 backdrop-blur-md">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Account Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{bank.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Account No</span>
                      <span className="font-black font-mono tracking-wider text-slate-900 dark:text-white">{bank.account_number}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">IFSC</span>
                      <span className="font-bold font-mono tracking-wider text-slate-900 dark:text-white">{bank.ifsc_code}</span>
                    </div>
                  </div>

                  {bank.is_default && (
                    <div className="mt-6 flex items-center justify-center gap-2 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl border border-indigo-500/20">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Default Account
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {banks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6 transform -rotate-6">
                  <Landmark className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                  No Bank Accounts Found
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mb-8">
                  Add your first bank account to display payment details clearly on your quotations and invoices.
                </p>
                <button
                  onClick={() => setEditingBank({ 
                    bank_name: "", account_name: "", account_number: "", ifsc_code: "", branch_name: "", is_default: true 
                  })}
                  className="group relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <Plus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Add First Bank Account</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
