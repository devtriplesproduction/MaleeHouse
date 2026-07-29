'use client';

import React from 'react';
import { Users, Phone, Award } from 'lucide-react';

interface WorkforceMember {
  name: string;
  role: string;
  phone: string;
  payout: number;
  avatar: string;
}

const workforceData: WorkforceMember[] = [
  { name: "David Krupp", role: "Project Manager", phone: "+1 (305) 555-0167", payout: 120, avatar: "DK" },
  { name: "Jessica Shelby", role: "Site Supervisor", phone: "+1 (305) 555-0192", payout: 150, avatar: "JS" },
  { name: "Rachel Green", role: "Foreman", phone: "+1 (650) 555-0178", payout: 100, avatar: "RG" },
  { name: "John Goodwill", role: "Civil Engineer", phone: "+1 (650) 555-0165", payout: 200, avatar: "JG" },
  { name: "Adam Watson", role: "Architect", phone: "+1 (818) 555-0148", payout: 140, avatar: "AW" },
  { name: "Billi Betson", role: "Structural Engineer", phone: "+1 (617) 555-0195", payout: 90, avatar: "BB" },
  { name: "Mark Ruffalo", role: "MEP Engineer", phone: "+1 (310) 555-0184", payout: 165, avatar: "MR" },
  { name: "William Jackson", role: "Plumber", phone: "+1 (310) 555-0157", payout: 145, avatar: "WJ" }
];

export function WorkforceBudgetTable() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base tracking-tight">
              Workforce Directory
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              Active team daily payout tracking and contact registry
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200/20 dark:border-white/5">
          {workforceData.length} Personnel
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4.5">Name</th>
              <th className="px-6 py-4.5">Role</th>
              <th className="px-6 py-4.5">Phone Number</th>
              <th className="px-6 py-4.5 text-right">Daily Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent">
            {workforceData.map((member) => (
              <tr 
                key={member.name} 
                className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-200"
              >
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200/30 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                      {member.avatar}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {member.name}
                    </span>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    {member.role}
                  </span>
                </td>

                {/* Phone */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs nums text-slate-500 dark:text-slate-400 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {member.phone}
                  </span>
                </td>

                {/* Daily Payout */}
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold nums bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/20 dark:border-white/5 shadow-sm">
                    ${member.payout} / day
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
