"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateLeaveStatusAction } from "@/actions/leave.actions";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CalendarClock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function LeaveApprovalQueue({ leaves }: { leaves: any[] }) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const pendingLeaves = leaves.filter((l) => l.status === "pending");

  const handleUpdate = async (id: string, status: "approved" | "rejected") => {
    setIsUpdating(id);
    const res = await updateLeaveStatusAction(id, status);
    if (res.success) {
      toast({ title: `Leave ${status}` });
    } else {
      toast({ title: "Failed to update leave", description: res.error, variant: "destructive" as any });
    }
    setIsUpdating(null);
  };

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
            <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Leave Approvals</CardTitle>
            <CardDescription className="text-xs mt-0.5">Pending requests awaiting HR review</CardDescription>
          </div>
          <span className="ml-auto bg-indigo-600 text-white text-xs py-1 px-2.5 rounded-full font-semibold shadow-sm">
            {pendingLeaves.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[350px]">
        {pendingLeaves.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
              <CalendarClock className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-300">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending leave requests in the queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-200 group">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {leave.profiles?.first_name} {leave.profiles?.last_name}
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold py-0 h-5 px-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                        {leave.leave_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-md py-1 px-2 w-fit">
                      <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      {format(new Date(leave.start_date), "MMM d, yyyy")} 
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span> 
                      {format(new Date(leave.end_date), "MMM d, yyyy")}
                    </div>
                    
                    {leave.reason && (
                      <div className="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200/80 p-2.5 rounded-lg border border-amber-100/50 dark:border-amber-900/30 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
                        <span className="italic leading-relaxed">{leave.reason}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col gap-2 shrink-0 sm:opacity-80 group-hover:opacity-100 transition-opacity justify-end sm:justify-start">
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors w-full sm:w-auto"
                      disabled={isUpdating === leave.id}
                      onClick={() => handleUpdate(leave.id, "approved")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors w-full sm:w-auto"
                      disabled={isUpdating === leave.id}
                      onClick={() => handleUpdate(leave.id, "rejected")}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

