"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateCompanySettingsAction, CompanySettings } from "@/actions/settings.actions";
import { Building2, MapPin, Phone, Hash, Save, CreditCard, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialSettings: CompanySettings;
  canEdit?: boolean;
  activeTab?: 'details' | 'bank';
}

export function CompanySettingsForm({ initialSettings, canEdit = true, activeTab = 'bank' }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CompanySettings>(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCompanySettingsAction(formData);
      if (result.success) {
        toast({
          title: "Settings Updated",
          description: "Company details have been updated successfully.",
          variant: "success",
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update settings.",
          variant: "error",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Company Identity</h2>
          <p className="text-xs font-medium text-slate-500">Manage your company's location and contact details</p>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Company Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" /> GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Address Line
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> City, State & ZIP
            </label>
            <input
              type="text"
              name="cityStateZip"
              value={formData.cityStateZip || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Telephone
            </label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Mobile
            </label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={!canEdit}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Landmark className="h-3.5 w-3.5" /> Bank Name
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Account Name
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" /> Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" /> IFSC Code
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Branch Name
            </label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> UPI ID
            </label>
            <input
              type="text"
              name="upiId"
              value={formData.upiId || ""}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canEdit}
            />
          </div>
        </div>
      )}

      {canEdit && (
        <div className="pt-4 border-t border-slate-100 flex justify-end mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-70"
          >
            {isPending ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
}
