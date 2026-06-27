"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OnboardingInProgress({ data }: { data: any[] }) {
  const onboardings = data || [];

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4.5 w-4.5 text-blue-500" />
          <CardTitle className="text-base font-bold">Onboarding Progress</CardTitle>
          <span className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-xs py-0.5 px-2 rounded-full font-medium">
            {onboardings.length}
          </span>
        </div>
        <CardDescription className="text-xs">New hires pending setup completion</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
        {onboardings.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center">
            <UserPlus className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p>No active onboardings right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {onboardings.map((user) => (
              <div key={user.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {user.email}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
                    Invited
                  </Badge>
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <div className="text-[10px] text-right mt-1 text-slate-400 font-medium">
                  Documents Pending
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
