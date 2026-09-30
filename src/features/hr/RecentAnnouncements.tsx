"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export function RecentAnnouncements({ announcements }: { announcements: any[] }) {
  const posts = announcements || [];

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-950/20 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Announcements</CardTitle>
            <CardDescription className="text-xs font-medium mt-0.5">Latest company updates</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto thin-scrollbar">
        {posts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No announcements yet</p>
            <p className="text-xs text-slate-500">Keep the team informed by posting company news here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {posts.map((post, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                  {post.title}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {post.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
