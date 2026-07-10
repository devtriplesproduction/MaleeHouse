"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle2, AlertCircle, Save, X, Loader2, Landmark } from "lucide-react";
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-500" />
            Bank Accounts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage bank accounts that can be selected in quotations and invoices.
          </p>
        </div>
        {!editingBank && (
          <button
            onClick={() => setEditingBank({ 
              bank_name: "", account_name: "", account_number: "", ifsc_code: "", branch_name: "", is_default: false 
            })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Bank Account
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editingBank ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">
                {editingBank.id ? "Edit Bank Account" : "New Bank Account"}
              </h3>
              <button
                onClick={() => setEditingBank(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Name *</label>
                  <input
                    type="text"
                    value={editingBank.bank_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, bank_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Name *</label>
                  <input
                    type="text"
                    value={editingBank.account_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, account_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
                    placeholder="e.g. Morya Enterprises"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Number *</label>
                  <input
                    type="text"
                    value={editingBank.account_number || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, account_number: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
                    placeholder="e.g. 50200000000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IFSC Code *</label>
                  <input
                    type="text"
                    value={editingBank.ifsc_code || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, ifsc_code: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch Name *</label>
                  <input
                    type="text"
                    value={editingBank.branch_name || ""}
                    onChange={(e) => setEditingBank({ ...editingBank, branch_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
                    placeholder="e.g. MG Road Branch"
                  />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBank.is_default || false}
                      onChange={(e) => setEditingBank({ ...editingBank, is_default: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-sm font-medium">Set as Default Bank Account</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Bank Account
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
                  "bg-white dark:bg-[#0c1222] border rounded-xl p-6 transition-all",
                  bank.is_default 
                    ? "border-blue-500 dark:border-blue-500/50 shadow-md shadow-blue-500/5" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      bank.is_default ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bank.bank_name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {bank.branch_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!bank.is_default && (
                      <button
                        onClick={() => handleSetDefault(bank.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                        title="Set as Default"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingBank(bank)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Account Name:</span>
                    <span className="font-medium">{bank.account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">A/C No:</span>
                    <span className="font-medium">{bank.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">IFSC:</span>
                    <span className="font-medium">{bank.ifsc_code}</span>
                  </div>
                </div>

                {bank.is_default && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Default Bank Account
                  </div>
                )}
              </div>
            ))}

            {banks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Landmark className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                  No Bank Accounts
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Add a bank account to display your payment details on quotations and invoices.
                </p>
                <button
                  onClick={() => setEditingBank({ 
                    bank_name: "", account_name: "", account_number: "", ifsc_code: "", branch_name: "", is_default: true 
                  })}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Bank
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
