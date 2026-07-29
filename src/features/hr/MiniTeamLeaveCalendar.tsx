"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MiniTeamLeaveCalendar({ leaves }: { leaves: any[] }) {
  // Filter for approved leaves happening around now (mock simple logic)
  const approvedLeaves = leaves.filter(l => l.status === 'approved');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Card className="glass-card shadow-lg border-slate-200/50 dark:border-white/10 h-full flex flex-col overflow-hidden hover:border-cyan-400/30 transition-colors duration-300">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <Plane className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Team Leave Calendar</CardTitle>
            <CardDescription className="text-xs font-medium mt-0.5">Who's off this week</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto thin-scrollbar">
        {approvedLeaves.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center flex flex-col items-center justify-center h-full space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-1">
              <Plane className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Everyone is in the office!</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-white/5"
          >
            {approvedLeaves.map((leave, idx) => (
              <motion.div 
                variants={item}
                key={idx} 
                className="p-4 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-400 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    {leave.profiles?.first_name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {leave.profiles?.first_name} {leave.profiles?.last_name}
                    </div>
                    <div className="text-xs font-medium text-slate-500 capitalize mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      {leave.leave_type} Leave
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 px-2.5 py-1.5 rounded-md border border-slate-200/50 dark:border-white/5 group-hover:border-cyan-200 dark:group-hover:border-cyan-500/30 transition-colors whitespace-nowrap">
                  {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d")}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
