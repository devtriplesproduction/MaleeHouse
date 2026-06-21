import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  ListTodo
} from 'lucide-react';
import Link from 'next/link';

interface ProjectTaskProgressProps {
  projectId: string;
}

export async function ProjectTaskProgress({ projectId }: ProjectTaskProgressProps) {
  const supabase: any = await createClient();
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles:assigned_to (
        first_name,
        last_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error || !tasks) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Task Progress</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">{completedTasks}/{totalTasks} COMPLETED</span>
          <div className="w-32 h-2 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task: any) => (
          <div key={task.id} className="glass-card p-4 border-white/10 group hover:border-indigo-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                task.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : 
                task.status === 'rejected' ? "bg-rose-500/10 text-rose-500" :
                "bg-amber-500/10 text-amber-500"
              )}>
                {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                 task.status === 'rejected' ? <AlertCircle className="w-4 h-4" /> :
                 <Clock className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{task.title}</h4>
                <p className="text-xs text-gray-500 font-medium italic">
                  Assigned to: {task.profiles?.first_name} {task.profiles?.last_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                task.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                task.status === 'rejected' ? "bg-rose-500/10 text-rose-500" :
                "bg-amber-500/10 text-amber-500"
              )}>
                {task.status}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-sm text-gray-500 italic">No tasks created for this project yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
