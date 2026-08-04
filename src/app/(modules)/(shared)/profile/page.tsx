import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, Lock, CheckCircle2, User, Key, Globe } from "lucide-react";
import UpdatePasswordClient from "./UpdatePasswordClient";
import ActiveSessionsClient from "./ActiveSessionsClient";
import IDCardClient from "./IDCardClient";
import { getCompanySettingsAction } from "@/actions/settings.actions";
import DownloadButtonClient from "./DownloadButtonClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
   const { profile: rawProfile } = await requireAuth();
   const profile = rawProfile as any;
   const companySettings = await getCompanySettingsAction();

   return (
      <div className="w-full space-y-4 animate-in fade-in duration-750 pb-4 text-slate-900 dark:text-white">
         
         {/* ── Title Row ── */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  User <span className="text-indigo-500 dark:text-indigo-400">Profile</span>
               </h1>
               <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Manage your personal identity credentials and access sessions.
               </p>
            </div>
            
            <div className="flex items-center gap-3">
               <DownloadButtonClient />
            </div>
         </div>

         {/* ── Interactive Layout Grid ── */}
         <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-stretch pt-1">
            
            {/* Left Panel: Digital Badge Showcase */}
            <div className="relative rounded-3xl bg-slate-50/40 dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 p-4 md:p-6 flex flex-col items-center justify-center overflow-hidden min-h-0">
               {/* Decorative background grid and glow */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
               <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
               
               <div className="relative z-10 w-full flex flex-col items-center py-2">
                  <IDCardClient profile={profile} companySettings={companySettings} />
               </div>
            </div>

            {/* Right Panel: Account Security Matrix */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#090d16] p-5 shadow-sm flex flex-col justify-between space-y-4">
               <div className="space-y-4">
                  {/* Panel Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                     <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                        <Shield className="w-4.5 h-4.5" />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Access</h3>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-550">System authorization metrics</p>
                     </div>
                  </div>

                  {/* Warning Info box */}
                  <div className="p-3.5 rounded-xl bg-amber-500/[0.02] border border-amber-500/15 flex items-start gap-2.5">
                     <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                     <p className="text-[10.5px] text-amber-600 dark:text-amber-400/90 leading-relaxed font-semibold">
                        Keep your security settings updated to prevent unauthorized access. Rotating credentials periodicially increases data safety.
                     </p>
                  </div>

                  {/* Inline Stats/Metadata Rows */}
                  <div className="space-y-2 pt-1">
                     
                     {/* Row 1: Profile identity */}
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                           <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-505" />
                           <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Account Access</span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/25 uppercase tracking-wider">
                           {profile.role || "Employee"}
                        </span>
                     </div>

                     {/* Row 2: Password Status */}
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                           <Key className="w-3.5 h-3.5 text-slate-400 dark:text-slate-505" />
                           <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Password Integrity</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                           <span>Secured</span>
                        </div>
                     </div>

                     {/* Row 3: Active connection state */}
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                           <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-505" />
                           <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Active Connections</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                           </span>
                           <span className="text-xs font-black text-slate-800 dark:text-slate-200">3 Devices Online</span>
                        </div>
                     </div>

                  </div>
               </div>

               {/* Action triggers */}
               <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <UpdatePasswordClient userId={profile.id} />
                  <ActiveSessionsClient />
               </div>
            </div>

         </div>

      </div>
   );
}
