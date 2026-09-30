"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OnboardingInProgress({ data }: { data: any[] }) {
  const onboardings = data || [];

  const calculateProgress = (user: any) => {
    const fieldsToCheck = [
      'first_name', 'last_name', 'phone_number', 'dob', 'gender',
      'personal_email', 'emergency_contact', 'address', 'profile_photo'
    ];
    let filled = 0;
    fieldsToCheck.forEach(field => {
      if (user[field]) filled++;
    });
    
    // also check documents
    let docsCount = 0;
    if (user.documents && typeof user.documents === 'object') {
       docsCount = Object.keys(user.documents).length;
    }
    
    const totalWeight = fieldsToCheck.length + 3; // documents have weight of 3
    const score = filled + Math.min(docsCount, 3);
    
    return Math.round((score / totalWeight) * 100);
  };

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Onboarding</CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">New hires pending setup</CardDescription>
            </div>
          </div>
          <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold tracking-wider py-1 px-2.5 rounded-md">
            {onboardings.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto thin-scrollbar">
        {onboardings.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center">
            <UserPlus className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p>No active onboardings right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {onboardings.map((user) => {
              const progress = calculateProgress(user);
              const isDocsPending = !user.documents || Object.keys(user.documents).length === 0;
              
              return (
                <div key={user.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {user.first_name || "Unknown"} {user.last_name || ""}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {user.email}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
                      {user.status === 'invited' ? 'Invited' : user.status}
                    </Badge>
                  </div>
                  <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {progress}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {isDocsPending ? "Documents Pending" : "Profile Incomplete"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
