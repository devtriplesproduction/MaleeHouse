import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, Mail, Phone, Calendar, Briefcase, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import UpdatePasswordClient from "./UpdatePasswordClient";
import ActiveSessionsClient from "./ActiveSessionsClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile: rawProfile } = await requireAuth();
  const profile = rawProfile as any;

  const details = [
    { label: "Identity Designation", value: `${profile.first_name} ${profile.last_name}`, icon: UserIcon },
    { label: "Digital Vector", value: profile.email, icon: Mail },
    { label: "Operational Authority", value: profile.role, icon: Shield, highlight: true },
    { label: "Strategic Department", value: profile.department || "General Operations", icon: Briefcase },
    { label: "Communication Bridge", value: profile.phone_number || "Not provided", icon: Phone },
    { label: "Chronos Origin", value: new Date(profile.created_at).toLocaleDateString(), icon: Calendar },
  ];

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
        
        {/* Profile Summary Badge */}
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
           </div>
           <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile.first_name} {profile.last_name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{profile.role}</span>
           </div>
        </div>
      </div>

      {/* ── Main content architecture ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Information Grid */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {details.map((item, idx) => (
              <div key={idx} className="glass-card p-6 border-white/10 flex items-center gap-5 group hover:border-indigo-500/20 transition-all duration-500">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                  item.highlight 
                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                    : "bg-slate-500/5 text-slate-400 border-slate-100 dark:border-white/5"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                  <p className="text-[15px] font-medium text-slate-900 dark:text-white capitalize tracking-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & System Actions */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass-card p-8 border-white/10 bg-indigo-500/[0.02] space-y-8">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Security Protocol</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">Safeguard your operational access. We recommend rotating your credentials periodically.</p>
              </div>

              <div className="space-y-3">
                <UpdatePasswordClient userId={profile.id} />
                <ActiveSessionsClient />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
