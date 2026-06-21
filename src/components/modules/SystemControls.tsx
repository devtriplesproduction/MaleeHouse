"use client";

import React, { useState } from "react";
import { Database, Trash2, ShieldCheck, Info, Loader2, Terminal, ShieldAlert } from "lucide-react";
import { seedTestingAccountsAction } from "@/actions/seed.actions";
import { adminWipeSystemAction } from "@/actions/admin.actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function SystemControls() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    if (!confirm("This will create 6 testing accounts. Continue?")) return;
    
    setIsSeeding(true);
    try {
      const res = await seedTestingAccountsAction();
      if (res?.success) {
        toast({
          title: "Platform Seeded",
          description: "All role-based testing accounts are ready.",
          variant: "success",
        });
      }
    } catch (err) {
      toast({ title: "Seeding Failed", variant: "error" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleWipe = async () => {
    if (!confirm("Purge ALL operational data? This cannot be undone.")) return;
    
    setIsWiping(true);
    try {
      const res = await adminWipeSystemAction();
      if (res?.success) {
        toast({ title: "System Purged", description: res.message, variant: "success" });
      } else {
        toast({ title: "Wipe Failed", description: res?.error, variant: "error" });
      }
    } catch (err) {
      toast({ title: "Operation Failed", variant: "error" });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="glass-card p-8 border-white/10 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
          <Terminal className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Initialization</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seed Platform */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:border-indigo-500/20 transition-all group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest">Dev Tool</div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Seed Testing Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">Provision a complete set of role-based accounts for staging validation.</p>
          </div>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {isSeeding ? "Provisioning..." : "Seed Platform"}
          </button>
        </div>

        {/* Wipe Data */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:border-rose-500/20 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-widest">Admin Only</div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Purge Operational Data</h3>
            <p className="text-xs text-slate-500 mt-1">Reset the platform by wiping all projects, tasks, and activity logs.</p>
          </div>
          <button 
            onClick={handleWipe}
            disabled={isWiping}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            {isWiping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {isWiping ? "Purging..." : "Wipe Data"}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-600/80 font-medium leading-relaxed">
          <span className="font-bold">Standardized Credentials:</span> Seeded accounts use the password <span className="font-bold text-amber-700">MaleeHouse2026!</span> and follow the pattern <span className="font-bold text-amber-700">role@maleehouse.com</span>.
        </p>
      </div>
    </div>
  );
}
