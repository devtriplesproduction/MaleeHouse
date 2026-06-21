'use client';

import React from 'react';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSatisfactionMetricProps {
  data: {
    average: number;
    total: number;
    distribution: number[];
  };
}

export function ClientSatisfactionMetric({ data }: ClientSatisfactionMetricProps) {
  const maxDistribution = Math.max(...data.distribution, 1);

  return (
    <div className="glass-card p-8 space-y-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Award className="w-4 h-4 text-amber-500" />
            Client Satisfaction
          </div>
          <h3 className="text-2xl font-bold">Happiness Index</h3>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-black text-amber-500 flex items-center gap-2">
            {data.average}
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Based on {data.total} reviews
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-4 group/row">
            <div className="flex items-center gap-1 w-8">
              <span className="text-xs font-bold text-slate-500">{rating}</span>
              <Star className="w-3 h-3 text-slate-300 fill-slate-300" />
            </div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out rounded-full",
                  rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${(data.distribution[rating - 1] / maxDistribution) * 100}%` }}
              />
            </div>
            <div className="w-8 text-right">
              <span className="text-xs font-bold text-slate-400 group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">
                {data.distribution[rating - 1]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 relative z-10">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Retention
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">94%</div>
        </div>
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter flex items-center gap-1">
            <Users className="w-3 h-3" />
            New Leads
          </div>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">+12%</div>
        </div>
      </div>
    </div>
  );
}
