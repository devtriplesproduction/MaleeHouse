"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateCompanySettingsAction, type CompanySettings } from "@/actions/settings.actions";
import { Building2, MapPin, Phone, Hash, Save, ShieldCheck, Mail, Smartphone, Star, Globe } from "lucide-react";
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
        toast({ title: "Settings Updated", description: "Company details have been updated successfully.", variant: "success" });
      } else {
        toast({ title: "Update Failed", description: result.error || "Failed to update settings.", variant: "error" });
      }
    });
  };

  const initials = (formData.name || "MH")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

      {/* ── Live Preview Card ── */}
      <div className="lg:col-span-2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1222] shadow-xl p-7">
          {/* Company Icon */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl font-black tracking-tight border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                {initials}
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
                <Star className="w-2.5 h-2.5 text-amber-900 fill-amber-900" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-tight truncate text-slate-900 dark:text-white">
                {formData.name || "Company Name"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Registered Business</p>
            </div>
          </div>

          {/* GSTIN */}
          <div className="flex items-center gap-2.5 mb-6 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-white/5">
            <ShieldCheck className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">GSTIN</div>
              <div className="text-xs font-semibold tracking-widest text-slate-700 dark:text-slate-300">{formData.gstin || "NOT SET"}</div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-white/5">
            <div className="space-y-1">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Registered Address</div>
              <div className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div>{formData.address || "Address Line"}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{formData.cityStateZip || "City, State & ZIP"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Contact Channels</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formData.telephone || "Telephone"}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formData.mobile || "Mobile"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Digital Channels</div>
              <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formData.email || "Email"}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formData.website || "Website"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="lg:col-span-3 relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 dark:bg-[#0c1222]/80 backdrop-blur-2xl shadow-xl p-7 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3 mb-8 pb-5 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Company Identity</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Core information shown on all documents</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Company Name
            </label>
            <input type="text" name="name" value={formData.name || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-indigo-500" /> GSTIN
            </label>
            <input type="text" name="gstin" value={formData.gstin || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs uppercase placeholder:normal-case"
              required disabled={!canEdit} placeholder="e.g. 27AADCB2230M1Z2" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address Line
            </label>
            <input type="text" name="address" value={formData.address || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-indigo-500" /> City, State & ZIP
            </label>
            <input type="text" name="cityStateZip" value={formData.cityStateZip || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} placeholder="e.g. Mumbai, Maharashtra 400001" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-indigo-500" /> Telephone
            </label>
            <input type="tel" name="telephone" value={formData.telephone || ""} onChange={handleChange}
              maxLength={10} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-indigo-500" /> Mobile Number
            </label>
            <input type="tel" name="mobile" value={formData.mobile || ""} onChange={handleChange}
              maxLength={10} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email
            </label>
            <input type="email" name="email" value={formData.email || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} placeholder="e.g. info@maleehouse.com" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-indigo-500" /> Website
            </label>
            <input type="text" name="website" value={formData.website || ""} onChange={handleChange}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/25 text-sm font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0c1222] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              required disabled={!canEdit} placeholder="e.g. www.maleehouse.com" />
          </div>
        </div>

        {canEdit && (
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-200/50 dark:border-white/10 flex justify-end">
            <button type="submit" disabled={isPending}
              className="group/btn relative flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/45 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center gap-2">
                {isPending ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? "Saving changes..." : "Save Changes"}
              </div>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
