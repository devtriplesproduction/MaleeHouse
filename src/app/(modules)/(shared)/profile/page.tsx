import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, Mail, Phone, Calendar, Briefcase, User as UserIcon, MapPin, Globe, Users, FileText, Home } from "lucide-react";
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

   return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-0 px-4 md:px-8 pb-8">
         {/* ── Header Section ── */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-white/5">
            <div className="space-y-1">
               <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  User <span className="text-indigo-500">Profile</span>
               </h1>
               <p className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                  Manage your personal identity and security parameters within the ecosystem.
               </p>
            </div>
         </div>

         {/* ── Identity Cards Section ── */}
         <IDCardClient profile={profile} companySettings={companySettings} />

         {/* ── Security Protocol Section ── */}
         <div className="max-w-3xl mx-auto pt-8">
            <div className="glass-card p-8 border-white/10 bg-indigo-500/[0.02] space-y-8">
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                     <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Security Protocol</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">Safeguard your operational access. We recommend rotating your credentials periodically.</p>
               </div>

               <div className="space-y-4">
                  <UpdatePasswordClient userId={profile.id} />
                  <ActiveSessionsClient />
               </div>
            </div>
         </div>

      </div>
   );
}
