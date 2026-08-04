import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, Lock } from "lucide-react";
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
      <div className="w-full space-y-6 animate-in fade-in duration-750 pb-8 text-slate-900 dark:text-white">
         
         {/* ── Heading Row matching Team Management style exactly ── */}
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

         {/* ── Side-by-Side Content Grid ── */}
         <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start pt-2">
            
            {/* Left Column: ID Card */}
            <div className="flex flex-col items-center justify-center w-full">
               <IDCardClient profile={profile} companySettings={companySettings} />
            </div>

            {/* Right Column: Security Controls */}
            <div className="glass-card p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-[#090d16] rounded-2xl shadow-sm space-y-6 sticky top-24 w-full">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                     <Shield className="w-4 h-4" />
                  </div>
                  <div>
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Access</h3>
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Manage authorization credentials</p>
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-amber-500/[0.02] border border-amber-500/15 flex items-start gap-3">
                  <Lock className="w-3.5 h-3.5 text-amber-550 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed font-semibold">
                     We recommend updating your password periodically and auditing active sessions to secure system transactions.
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  <UpdatePasswordClient userId={profile.id} />
                  <ActiveSessionsClient />
               </div>
            </div>

         </div>

      </div>
   );
}
