'use client';

import React from 'react';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Medal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardUser {
  id: string;
  name: string;
  role: string;
  totalTransitions: number;
  onTimeCount: number;
  delayedCount: number;
  score: number;
}

interface TeamPerformanceLeaderboardProps {
  data: LeaderboardUser[];
}

export function TeamPerformanceLeaderboard({ data = [] }: TeamPerformanceLeaderboardProps) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Efficiency</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Target vs Actual Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-500 uppercase">Live Metrics</span>
        </div>
      </div>

      <div className="p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-xs uppercase tracking-widest font-bold text-gray-500">
              <th className="px-6 py-4">Specialist</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Efficiency Score</th>
              <th className="px-6 py-4 text-center">On-Time</th>
              <th className="px-6 py-4 text-center">Delayed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {safeData?.map((user, index) => (
              <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                      index === 0 ? "bg-amber-500/20 border-amber-500/50 text-amber-500" :
                      index === 1 ? "bg-slate-300/20 border-slate-300/50 text-slate-400" :
                      index === 2 ? "bg-orange-400/20 border-orange-400/50 text-orange-500" :
                      "bg-white/5 border-white/10 text-gray-500"
                    )}>
                      {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-500">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full max-w-[100px] h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          user.score >= 90 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                          user.score >= 75 ? "bg-indigo-500" :
                          "bg-amber-500"
                        )}
                        style={{ width: `${user.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{user.score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-bold text-xs">
                    <Target className="w-3 h-3" />
                    {user.onTimeCount}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-rose-500 font-bold text-xs">
                    <Clock className="w-3 h-3" />
                    {user.delayedCount}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">No performance data available yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
