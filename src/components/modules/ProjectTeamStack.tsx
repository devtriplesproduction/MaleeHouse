import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { UserCircle2 } from 'lucide-react';
import { DraftingCompass } from 'lucide-react';
import { Map as MapIcon } from 'lucide-react';
import { Zap } from 'lucide-react';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { TeamManagementWrapper } from './TeamManagementWrapper';

interface ProjectTeamStackProps {
  projectId: string;
}

export async function ProjectTeamStack({ projectId }: ProjectTeamStackProps) {
  const supabase: any = await createClient();
  
  const { data: assignments, error } = await supabase
    .from('project_assignments')
    .select(`
      *,
      profiles!project_assignments_user_id_fkey (
        first_name,
        last_name,
        email,
        role
      )
    `)
    .eq('project_id', projectId);

  if (error || !assignments) return null;

  const roleIcons: Record<string, any> = {
    admin: ShieldCheck,
    sales_rep: Zap,
    engineer: DraftingCompass,
    cad: DraftingCompass,
    field: MapIcon,
  };

  return (
    <div className="glass-card p-6 shadow-md shadow-slate-100/40 dark:shadow-none bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Project Team</h3>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {assignments.map((assignment: any) => {
            const Icon = roleIcons[assignment.role] || UserCircle2;
            return (
              <div key={assignment.id} className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm transition-transform group-hover:scale-105 duration-300">
                    {assignment.profiles?.first_name?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 flex items-center justify-center shadow-xl">
                    <Icon className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1 truncate">
                    {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                  </p>
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                    {assignment.role.replace('_', ' ')}
                  </p>
                </div>

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-xs text-gray-500 italic">No team members assigned</p>
            </div>
          )}
        </div>

        <TeamManagementWrapper 
          projectId={projectId} 
          initialTeam={assignments.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            first_name: a.profiles?.first_name,
            last_name: a.profiles?.last_name,
            role: a.role,
            email: a.profiles?.email
          }))} 
        />
      </div>
    </div>
  );
}
