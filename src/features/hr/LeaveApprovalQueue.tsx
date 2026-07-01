"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateLeaveStatusAction } from "@/actions/leave.actions";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CalendarClock } from "lucide-react";
import { format } from "date-fns";

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
          <CalendarClock className="h-4.5 w-4.5 text-indigo-500" />
          <CardTitle className="text-base font-bold">Leave Approvals</CardTitle>
          <span className="ml-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs py-0.5 px-2 rounded-full font-medium">
            {pendingLeaves.length}
          </span>
        </div>
        <CardDescription className="text-xs">Pending requests awaiting HR review</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
        {pendingLeaves.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center">
            <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p>Queue is completely clear!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {leave.profiles?.first_name} {leave.profiles?.last_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{leave.leave_type}</span> leave
                      <br/>
                      {format(new Date(leave.start_date), "MMM d, yyyy")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                    </div>
                    {leave.reason && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-md italic">
                        "{leave.reason}"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30"
                      disabled={isUpdating === leave.id}
                      onClick={() => handleUpdate(leave.id, "approved")}
                    >
                      <Check className="h-3 w-3 mr-1.5" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30"
                      disabled={isUpdating === leave.id}
                      onClick={() => handleUpdate(leave.id, "rejected")}
                    >
                      <X className="h-3 w-3 mr-1.5" /> Reject
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
