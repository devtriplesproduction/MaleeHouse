"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecentAnnouncements({ announcements }: { announcements: any[] }) {
  const posts = announcements || [];

  return (
    <Card className="shadow-sm border-slate-200 dark:border-white/10 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-violet-500" />
              <CardTitle className="text-base font-bold">Announcements</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">Latest company updates</CardDescription>
          </div>
          <Button size="sm" className="h-7 text-xs px-2.5 gap-1 bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-500 border-none flex items-center justify-center shrink-0 shadow-sm font-medium">
            <Plus className="h-3.5 w-3.5" /> Post New
          </Button>
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
