"use client";

import React, { useState } from "react";
import { Clock, MapPin, Package, Upload, CheckCircle2, ChevronRight, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { markVisitCompletedAction, createMaterialRequestAction } from "@/actions/field.actions";
export function AttendanceWidget() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  const handleToggle = () => {
    if (!checkedIn) {
      setCheckedIn(true);
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setCheckedIn(false);
      setTime(null);
    }
  };

  return (
    <div className="glass-card border-white/10 p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", checkedIn ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500")}>
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Attendance</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {checkedIn ? `Checked in at ${time}` : "Not checked in yet"}
          </p>
        </div>
      </div>
      <button 
        onClick={handleToggle}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-bold transition-all",
          checkedIn 
            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" 
            : "bg-emerald-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
        )}
      >
        {checkedIn ? "Check Out" : "Check In"}
      </button>
    </div>
  );
}

export function DailyVisitsWidget({ visits }: { visits: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleComplete = async (visitId: string) => {
    setLoadingId(visitId);
    const res = await markVisitCompletedAction(visitId);
    setLoadingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert("Failed to mark visit as completed: " + res.error);
    }
  };

  return (
    <div className="glass-card border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Assigned Project Visits</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-xs font-bold text-sky-500">
          {visits.length} Visits
        </span>
      </div>
      
      <div className="space-y-3">
        {visits.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No visits scheduled today.</p>
        ) : (
          visits.map((visit, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-sky-500">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{visit.project_name}</p>
                <p className="text-xs text-slate-500 truncate">{visit.location}</p>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{visit.time}</p>
                {visit.status === 'completed' ? (
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Visited Successfully</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleComplete(visit.id)}
                    disabled={loadingId === visit.id}
                    className="px-2 py-1 mt-1 text-[10px] font-bold bg-emerald-500 hover:bg-indigo-600 text-white rounded uppercase tracking-wider disabled:opacity-50 transition-colors"
                  >
                    {loadingId === visit.id ? 'Updating...' : 'Mark Visited'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function MaterialRequirementsWidget({ materials, activeProjects = [] }: { materials: any[], activeProjects?: any[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || "");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !item || !qty) return;
    setSubmitting(true);
    const res = await createMaterialRequestAction(projectId, item, Number(qty), notes);
    setSubmitting(false);
    if (res.success) {
      setItem("");
      setQty("");
      setNotes("");
      setShowForm(false);
      router.refresh();
    } else {
      alert("Failed to submit request: " + res.error);
    }
  };

  return (
    <div className="glass-card border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Material Requirements</h3>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold text-indigo-500 hover:underline"
        >
          {showForm ? "Cancel" : "+ Request"}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-white/5">
          {activeProjects.length > 0 ? (
            <select 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="" disabled>Select Project</option>
              {activeProjects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-rose-500 font-bold">No active projects assigned to you.</p>
          )}

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Item Name" 
              value={item} 
              onChange={(e) => setItem(e.target.value)}
              className="flex-1 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500"
              required
            />
            <input 
              type="number" 
              placeholder="Qty" 
              value={qty} 
              onChange={(e) => setQty(e.target.value)}
              className="w-20 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500"
              min="1"
              required
            />
          </div>
          <input 
            type="text" 
            placeholder="Notes (optional)" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500"
          />
          <button 
            type="submit" 
            disabled={submitting || activeProjects.length === 0}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No material requests.</p>
        ) : (
          materials.map((mat, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{mat.item}</p>
                <p className="text-xs text-slate-500">{mat.project_name} &bull; Qty: {mat.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                {mat.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {mat.status === 'requested' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                {mat.status === 'delivered' && <Package className="w-4 h-4 text-indigo-500" />}
                <span className="text-[10px] uppercase font-bold text-slate-400">{mat.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function QuickUploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setIsOpen(false);
      alert("File uploaded successfully!");
    }, 1500);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-dashed border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold transition-all"
      >
        <Upload className="w-5 h-5" />
        Quick Upload (Photos/Reports)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-500" />
              Upload Field Data
            </h3>
            <p className="text-sm text-slate-500">Select project and attach photos or reports.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Project</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm">
                  <option>Select a project...</option>
                  <option>Riverside Complex</option>
                  <option>Downtown Tower</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">File</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <FileText className="w-8 h-8 opacity-50" />
                  <span className="text-sm font-medium">Click to select file</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Notes (Optional)</label>
                <textarea className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm resize-none" rows={2} placeholder="Add any details here..."></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SiteProgressButton({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors tooltip-trigger"
        title="Update Progress"
      >
        <CheckCircle2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Update Progress</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Completion</span>
                  <span className="text-emerald-500">75%</span>
                </label>
                <input type="range" min="0" max="100" defaultValue="75" className="w-full mt-2 accent-emerald-500" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Status Update</label>
                <textarea className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm resize-none" rows={3} placeholder="What was accomplished today?"></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
              <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500 text-white hover:bg-indigo-600">Save Update</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
