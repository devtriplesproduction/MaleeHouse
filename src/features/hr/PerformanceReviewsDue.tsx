"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PerformanceReviewsDue() {
  // Stub for now until performance_reviews table is built
  const reviews = [];

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <Star className="h-4.5 w-4.5 text-amber-500" />
          <CardTitle className="text-base font-bold">Performance Reviews</CardTitle>
          <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-xs py-0.5 px-2 rounded-full font-medium">
            Due
          </span>
        </div>
        <CardDescription className="text-xs">Upcoming or overdue staff evaluations</CardDescription>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-1">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
          <Star className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">No pending reviews</h3>
        <p className="text-xs text-slate-500 max-w-[200px] mb-4">
          All employees are up to date on their performance appraisals.
        </p>
        <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
          Schedule Review
        </Button>
      </CardContent>
    </Card>
  );
}
