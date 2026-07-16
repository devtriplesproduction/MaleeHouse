"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarHeart } from "lucide-react";
import { format } from "date-fns";

export function UpcomingHolidaysWidget({ holidays }: { holidays: any[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const upcoming = (holidays || []).filter(holiday => {
    const holidayDate = new Date(holiday.date);
    // You can also add condition for upcoming: holidayDate >= new Date(new Date().setHours(0,0,0,0))
    return holidayDate.getMonth() === currentMonth && holidayDate.getFullYear() === currentYear;
  });

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-4.5 w-4.5 text-pink-500" />
          <CardTitle className="text-base font-bold">Upcoming Holidays</CardTitle>
        </div>
        <CardDescription className="text-xs">Next official days off</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto thin-scrollbar">
        {upcoming.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <CalendarHeart className="h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">No upcoming holidays this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {upcoming.map((holiday, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-white">
                    {holiday.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {holiday.is_mandatory ? 'Mandatory' : 'Optional'} Holiday
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                  <div className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase leading-none mb-1">
                    {format(new Date(holiday.date), "MMM")}
                  </div>
                  <div className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {format(new Date(holiday.date), "dd")}
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
