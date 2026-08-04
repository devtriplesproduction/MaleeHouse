import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, User as UserIcon } from "lucide-react";
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
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-0 px-4 md:px-8 pb-8 text-slate-900 dark:text-white">
         
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

         {/* ── Identity Cards Section ── */}
         <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50/50 dark:bg-[#070a13]/30 border border-slate-150 dark:border-white/5">
            <IDCardClient profile={profile} companySettings={companySettings} />
         </div>

         {/* ── Redesigned Security Block ── */}
         <div className="max-w-[450px] mx-auto">
            <div className="glass-card p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-[#090d16] rounded-2xl shadow-sm space-y-5">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                     <Shield className="w-4 h-4" />
                  </div>
                  <div>
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Access</h3>
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Manage your auth credentials</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-1">
                  <UpdatePasswordClient userId={profile.id} />
                  <ActiveSessionsClient />
               </div>
            </div>
         </div>

      </div>
   );
}
