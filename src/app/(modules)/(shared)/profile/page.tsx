import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { 
  Shield, Mail, Phone, Calendar, Briefcase, User as UserIcon, 
  MapPin, Globe2, Building2, BadgeCheck, Fingerprint, KeyRound, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import UpdatePasswordClient from "./UpdatePasswordClient";
import ActiveSessionsClient from "./ActiveSessionsClient";
import IDCardClient from "./IDCardClient";
import { getCompanySettingsAction } from "@/actions/settings.actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
   const { profile: rawProfile } = await requireAuth();
   const profile = rawProfile as any;
   const companySettings = await getCompanySettingsAction();

   const infoRow = (icon: React.ReactNode, label: string, value: string) => (
      <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5">
         <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            {icon}
         </div>
         <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{label}</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 truncate capitalize">{value}</p>
         </div>
      </div>
   );

   return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-0 px-4 md:px-8 pb-8 text-slate-900 dark:text-white">
         
         {/* ── Header Section ── */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-150 dark:border-white/5">
            <div className="space-y-1.5">
               <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-600 dark:from-white dark:to-slate-400">
                  User <span className="text-indigo-500">Profile</span>
               </h1>
               <p className="text-sm text-slate-550 dark:text-slate-400 font-semibold">
                  Manage your personal identity credentials and access sessions.
               </p>
            </div>
         </div>

         {/* ── Identity Cards Section ── */}
         <div className="space-y-6">
            <div className="border-l-[3.5px] border-indigo-500 pl-4 space-y-1">
               <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Digital Employee Identity</h2>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Verify or download your standard-issue Malee House ID badge.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50/50 dark:bg-[#070a13]/40 border border-slate-150 dark:border-white/5 shadow-inner">
               <IDCardClient profile={profile} companySettings={companySettings} />
            </div>
         </div>

         {/* ── Info & Security Dashboard Grid ── */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Column 1: Corporate Profile Card */}
            <div className="glass-card p-6 md:p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-[#090d16] rounded-3xl shadow-sm flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <Fingerprint className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Corporate Profile</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Relational context within the ERP</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                     {infoRow(<Building2 className="w-4 h-4" />, "Department", profile.department || "HQ Office")}
                     {infoRow(<Briefcase className="w-4 h-4" />, "Designation", profile.designation?.replace('_', ' ') || "Associate")}
                     {infoRow(<BadgeCheck className="w-4 h-4" />, "System Access", profile.role || "Employee")}
                     {infoRow(<Mail className="w-4 h-4" />, "Work Email", profile.email || "N/A")}
                     {infoRow(<Calendar className="w-4 h-4" />, "Joining Date", profile.joining_date ? new Date(profile.joining_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A")}
                     {infoRow(<Globe2 className="w-4 h-4" />, "Operational Zone", profile.operational_zone || "HQ Main Zone")}
                     {infoRow(<MapPin className="w-4 h-4" />, "Office Branch", profile.branch || "HQ Branch")}
                     {infoRow(<Phone className="w-4 h-4" />, "Personal Contact", profile.phone_number || "N/A")}
                  </div>
               </div>
            </div>

            {/* Column 2: Security & Authentication Access */}
            <div className="glass-card p-6 md:p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-[#090d16] rounded-3xl shadow-sm flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Shield className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Protocol</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Rotate credentials or log out sessions</p>
                     </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/15 flex items-start gap-3.5">
                     <Lock className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
                     <p className="text-xs text-amber-600 dark:text-amber-400/90 leading-relaxed font-semibold">
                        We highly recommend rotating your access password periodically and checking for unauthorized active sessions to maintain data integrity.
                     </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Rotate operational passkeys</span>
                     </div>
                     <UpdatePasswordClient userId={profile.id} />
                     
                     <div className="flex items-center gap-3 pt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Audit active connection points</span>
                     </div>
                     <ActiveSessionsClient />
                  </div>
               </div>
            </div>

         </div>

      </div>
   );
}
