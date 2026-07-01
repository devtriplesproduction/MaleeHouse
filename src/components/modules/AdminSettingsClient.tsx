"use client";

import React, { useState, useTransition } from 'react';
import { 
  Settings2, 
  Save, 
  Building2, 
  Mail, 
  Palette, 
  Target,
  ArrowRight,
  Loader2,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  Bell,
  Globe,
  Shield,
  Clock,
  Coins
} from 'lucide-react';
import { updateSystemSettingsAction } from '@/actions/settings.actions';
import { adminWipeSystemAction } from '@/actions/admin.actions';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  initialTargets: Record<string, number>;
  initialProfile: {
    company_name: string;
    support_contact: string;
    primary_color?: string;
  };
  initialNotify: {
    email_on_new_project: boolean;
    email_on_task_assigned: boolean;
    email_on_qc_rejection: boolean;
    email_on_payment_milestone: boolean;
  };
}

type SettingsSection = 'general' | 'workflow' | 'regional' | 'notifications' | 'security';

export default function AdminSettingsClient({ 
  initialTargets, 
  initialProfile,
  initialNotify
}: SettingsPageProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [isPending, startTransition] = useTransition();
  
  const [targets, setTargets] = useState(initialTargets);
  const [profile, setProfile] = useState(initialProfile);
  const [notify, setNotify] = useState(initialNotify);
  
  // Wipe State
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [wipeStep, setWipeStep] = useState(0);
  const [confirmText, setConfirmText] = useState("");

  const handleSave = (key: string, data: any) => {
    startTransition(async () => {
      const result = await updateSystemSettingsAction(key, data);
      if (result?.success) {
        toast({
          title: "Settings Synchronized",
          description: "Global configurations have been updated successfully.",
          variant: "success"
        });
      } else {
        toast({
          title: "Update Failed",
          description: result?.error || "Failed to update settings",
          variant: "error"
        });
      }
    });
  };

  const handleSystemWipe = () => {
    if (confirmText !== "ERASE_ALL_DATA") {
      toast({
        title: "Confirmation Failed",
        description: "Confirmation text mismatch",
        variant: "error"
      });
      return;
    }

    startTransition(async () => {
      const result = await adminWipeSystemAction();
      if (result?.success) {
        toast({
          title: "System Purged",
          description: result.message,
          variant: "success"
        });
        setIsWipeDialogOpen(false);
        setWipeStep(0);
        setConfirmText("");
      } else {
        toast({
          title: "Purge Failed",
          description: result?.error || "Failed to purge system data",
          variant: "error"
        });
      }
    });
  };

  const navItems = [
    { id: 'general', label: 'Organization', icon: Building2, color: 'text-indigo-500' },
    { id: 'workflow', label: 'Workflow Logic', icon: Target, color: 'text-amber-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-sky-500' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-rose-500' },
  ];

  return (
    <div className="min-h-full space-y-12 animate-in fade-in duration-500">
      {/* Page Header - Unified Style */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            System <span className="text-indigo-500">Settings</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            Orchestrate your enterprise operational foundation and global configurations.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingsSection)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold transition-all border",
                activeSection === item.id 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" 
                  : "bg-white/50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200/50 dark:border-white/5 hover:border-indigo-500/30 backdrop-blur-md"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeSection === item.id ? "text-white" : item.color)} />
              {item.label}
              {activeSection === item.id && <ArrowRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 glass-card border-white/10 overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 lg:p-10 flex-1">
            {activeSection === 'general' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Organization Profile</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Define your corporate identity and branding.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Company Name</label>
                    <input 
                      type="text" 
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      className="glass-input font-medium"
                      placeholder="e.g. Malee House"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Support Contact</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={profile.support_contact}
                        onChange={(e) => setProfile({ ...profile, support_contact: e.target.value })}
                        className="glass-input pl-12 font-medium"
                        placeholder="support@maleehouse.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 md:col-span-2 mt-4">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Brand Identity</label>
                    <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <div className="w-16 h-16 rounded-2xl shadow-inner border border-white/10" style={{ backgroundColor: profile.primary_color }} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Primary Brand Color</p>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            value={profile.primary_color}
                            onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                            className="glass-input nums max-w-[150px] text-center text-sm"
                            placeholder="#4F46E5"
                          />
                          <p className="text-xs text-slate-400 font-medium flex items-center italic">Influences buttons and highlights.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'workflow' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Workflow Logic</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Calibrate expected cycle times for stage transitions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(targets).map(([key, value]) => (
                    <div key={key} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold uppercase tracking-wider text-indigo-500">{key.replace("_", " ")}</p>
                        <p className="text-xs text-slate-400 font-medium">Target Duration</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => setTargets({ ...targets, [key]: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-right font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all no-spin"
                        />
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {activeSection === 'notifications' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Notifications</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Control automated systemic communication triggers.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'email_on_new_project', label: 'New Project Initiation', desc: 'Email admin when a project is launched' },
                    { id: 'email_on_task_assigned', label: 'Personnel Task Allocation', desc: 'Notify personnel when receiving new tasks' },
                    { id: 'email_on_qc_rejection', label: 'Quality Review Rejection', desc: 'Alert leads when QC reviews fail' },
                    { id: 'email_on_payment_milestone', label: 'Payment Confirmation', desc: 'Notify on verified transaction success' },
                  ].map((item) => (
                    <div key={item.id} className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium opacity-80">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => setNotify({ ...notify, [item.id]: !notify[item.id as keyof typeof notify] })}
                        className={cn(
                          "w-14 h-8 rounded-full transition-all flex items-center px-1",
                          notify[item.id as keyof typeof notify] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                          notify[item.id as keyof typeof notify] ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Security & Maintenance</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Critical system management and lifecycle protocols.</p>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 space-y-6">
                  <div className="flex items-center gap-4 text-rose-500">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                      <AlertOctagon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Production Handover Protocol</h4>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-0.5">Danger Zone</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    This utility will execute a comprehensive system purge. All projects, tasks, comments, files, and activity logs will be permanently deleted. This is intended for clearing staging data before moving into live production. <strong>This action cannot be undone.</strong>
                  </p>
                  <button
                    onClick={() => { setIsWipeDialogOpen(true); setWipeStep(1); }}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Trash2 className="w-5 h-5" /> Execute Production Purge
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Save Bar */}
          <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/5 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">
              <div className={cn("w-2.5 h-2.5 rounded-full", isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500 shadow-sm shadow-indigo-500/20")} />
              {isPending ? "Syncing Config..." : "System Synchronized"}
            </div>
            <button
              onClick={() => {
                if (activeSection === 'general') handleSave('org_profile', profile);
                if (activeSection === 'workflow') handleSave('stage_targets', targets);
                if (activeSection === 'notifications') handleSave('notification_settings', notify);
              }}
              disabled={isPending || activeSection === 'security'}
              className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
        <DialogContent className="max-w-md p-8 glass-card border-rose-500/20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2 border border-rose-500/20 shadow-inner">
              <AlertOctagon className="w-8 h-8 text-rose-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white tracking-tight">System Wipe Protocol</DialogTitle>
            <DialogDescription className="text-center font-medium text-slate-500 dark:text-slate-400">
              {wipeStep === 1 && "This will delete all Projects, Tasks, Comments, and Files. This action is irreversible."}
              {wipeStep === 2 && "Are you absolutely sure? Profiles and settings will be preserved, but all operational history will vanish."}
              {wipeStep === 3 && "FINAL VERIFICATION: Please type ERASE_ALL_DATA below to authorize this operation."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 px-2">
            {wipeStep === 3 && (
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ERASE_ALL_DATA"
                className="glass-input text-center nums font-bold border-rose-500/30 focus:border-rose-500 text-rose-500 placeholder:text-rose-500/30 text-lg py-4"
              />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3">
            {wipeStep < 3 ? (
              <button
                onClick={() => setWipeStep(wipeStep + 1)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                I Understand, Continue
              </button>
            ) : (
              <button
                onClick={handleSystemWipe}
                disabled={isPending || confirmText !== "ERASE_ALL_DATA"}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "EXECUTE SYSTEM WIPE"}
              </button>
            )}
            <button
              onClick={() => { setIsWipeDialogOpen(false); setWipeStep(0); setConfirmText(""); }}
              className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel Operation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
