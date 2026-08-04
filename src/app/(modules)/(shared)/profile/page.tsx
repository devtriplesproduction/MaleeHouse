import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, User as UserIcon, Lock } from "lucide-react";
import { PageHeader } from "@/components/modules/PageHeader";
import UpdatePasswordClient from "./UpdatePasswordClient";
import ActiveSessionsClient from "./ActiveSessionsClient";
import IDCardClient from "./IDCardClient";
import { getCompanySettingsAction } from "@/actions/settings.actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
   const { profile: rawProfile } = await requireAuth();
   const profile = rawProfile as any;
   const companySettings = await getCompanySettingsAction();

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-0 px-4 md:px-8 pb-8 text-slate-900 dark:text-white">
         
         {/* ── Page Header ── */}
         <PageHeader 
            title={
               <>
                  User <span className="text-indigo-500">Profile</span>
               </>
            }
            subtitle="Manage your personal identity credentials and access sessions."
            icon={UserIcon}
         />

         {/* ── Responsive Side-by-Side Grid ── */}
         <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-2">
            
            {/* Left Side: Identity Card Panel */}
            <div className="flex flex-col items-center justify-center p-6 md:p-10 rounded-3xl bg-slate-50/50 dark:bg-[#070a13]/30 border border-slate-150 dark:border-white/5 w-full">
               <div className="w-full text-center mb-6">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Digital ID Badge</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Click the card to flip between front and back views</p>
               </div>
               <IDCardClient profile={profile} companySettings={companySettings} />
            </div>

            {/* Right Side: Security Block */}
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
