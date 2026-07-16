"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateCompanySettingsAction, CompanySettings } from "@/actions/settings.actions";
import { Building2, MapPin, Phone, Hash, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialSettings: CompanySettings;
  canEdit?: boolean;
  activeTab?: string;
}

export function CompanySettingsForm({ initialSettings, canEdit = true, activeTab }: Props) {
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
    <form onSubmit={handleSubmit} className="relative group max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white/40 dark:bg-[#0c1222]/80 backdrop-blur-2xl shadow-2xl p-8 sm:p-10 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
      
      <div className="relative z-10 flex items-start gap-4 mb-10 pb-6 border-b border-slate-200/50 dark:border-white/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-transform duration-300">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Company Identity</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your company's core information and registered address</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Company Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            required
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-indigo-500" /> GSTIN
          </label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm uppercase placeholder:normal-case"
            required
            disabled={!canEdit}
            placeholder="e.g. 27AADCB2230M1Z2"
          />
        </div>

        <div className="space-y-2.5 md:col-span-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address Line
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            required
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2.5 md:col-span-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" /> City, State & ZIP
          </label>
          <input
            type="text"
            name="cityStateZip"
            value={formData.cityStateZip || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            required
            disabled={!canEdit}
            placeholder="e.g. Mumbai, Maharashtra 400001"
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-indigo-500" /> Telephone
          </label>
          <input
            type="text"
            name="telephone"
            value={formData.telephone || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            required
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-indigo-500" /> Mobile
          </label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile || ""}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f1526] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            required
            disabled={!canEdit}
          />
        </div>
      </div>

      {canEdit && (
        <div className="relative z-10 pt-8 mt-8 border-t border-slate-200/50 dark:border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="group/btn relative flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative flex items-center gap-2">
              {isPending ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPending ? "Saving changes..." : "Save Changes"}
            </div>
          </button>
        </div>
      )}
    </form>
  );
}
