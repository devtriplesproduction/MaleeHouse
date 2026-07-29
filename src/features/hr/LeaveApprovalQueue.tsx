"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateLeaveStatusAction } from "@/actions/leave.actions";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CalendarClock, AlertCircle, CalendarDays, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

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
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-xl shadow-sm">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Leave Approvals</CardTitle>
            <CardDescription className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">Pending requests awaiting HR review</CardDescription>
          </div>
          {pendingLeaves.length > 0 && (
            <span className="ml-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs py-1 px-3 rounded-full font-bold shadow-sm">
              {pendingLeaves.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[500px] bg-slate-50/30 dark:bg-slate-950/20">
        {pendingLeaves.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-4 ring-4 ring-slate-50 dark:ring-slate-900">
              <CalendarClock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-base">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">No pending leave requests in the queue.</p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="group bg-white dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-0 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="p-5 pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Avatar 
                    src={leave.profiles?.avatar_url} 
                    fallback={`${leave.profiles?.first_name?.[0] || ""}${leave.profiles?.last_name?.[0] || ""}`}
                    className="h-12 w-12 rounded-full ring-2 ring-slate-50 dark:ring-slate-800 shadow-sm object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="font-semibold text-base text-slate-900 dark:text-white truncate">
                        {leave.profiles?.first_name} {leave.profiles?.last_name}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold py-0.5 h-5 px-2.5 bg-indigo-50 text-indigo-700 border-0 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {leave.leave_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{format(new Date(leave.start_date), "MMM d, yyyy")}</span>
                      <ArrowRight className="h-3 w-3 opacity-50" />
                      <span>{format(new Date(leave.end_date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                
                {leave.reason && (
                  <div className="px-5 pb-5">
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3.5 text-sm text-slate-700 dark:text-slate-300 flex gap-3 border border-slate-100 dark:border-slate-700/50 shadow-inner">
                      <AlertCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                      <p className="leading-relaxed break-words whitespace-pre-wrap">{leave.reason}</p>
                    </div>
                  </div>
                )}
                
                <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 mt-auto">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-9 px-4 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-all rounded-lg"
                    disabled={isUpdating === leave.id}
                    onClick={() => handleUpdate(leave.id, "rejected")}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-9 px-4 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all rounded-lg"
                    disabled={isUpdating === leave.id}
                    onClick={() => handleUpdate(leave.id, "approved")}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


