"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EODForm } from "./EODForm";
import { Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EODReport {
  id: string;
  date: string;
  tasks_completed: string;
  hours_spent: number;
  blockers: string | null;
}

interface EODFormModalProps {
  reports?: EODReport[];
  roleColor?: "blue" | "amber" | "emerald" | "purple" | "indigo";
}

const COLOR_MAP = {
  blue: {
    btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-blue-600/20 dark:shadow-blue-900/30",
    submitted: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  },
  amber: {
    btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-amber-600/20 dark:shadow-amber-900/30",
    submitted: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  },
  emerald: {
    btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-emerald-600/20 dark:shadow-emerald-900/30",
    submitted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  },
  purple: {
    btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 dark:shadow-purple-900/30",
    submitted: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  },
  indigo: {
    btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 dark:shadow-indigo-900/30",
    submitted: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
  },
};

export function EODFormModal({ reports = [], roleColor = "indigo" }: EODFormModalProps) {
  const [open, setOpen] = useState(false);
  const colors = COLOR_MAP[roleColor];

  // Determine if already submitted today
  const todayStr = new Date().toISOString().split("T")[0];
  const hasSubmittedToday = reports.some((r) => r.date === todayStr);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "h-11 px-5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm",
            hasSubmittedToday ? colors.submitted : colors.btn
          )}
        >
          {hasSubmittedToday ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              EOD Logged
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Log Daily EOD
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-2xl">
        <div className="pt-2">
          <EODForm reports={reports} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
