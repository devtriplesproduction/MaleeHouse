'use client';

import dynamic from 'next/dynamic';
import type { ProjectsListPage } from '@/actions/project.actions';
import { Briefcase } from 'lucide-react';

const ProjectsTable = dynamic(
  () => import('./ProjectsTable').then((m) => m.ProjectsTable),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] glass-card flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-indigo-500/40 to-purple-500/30 animate-pulse" />
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-indigo-500/10 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-500/50" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 animate-pulse">Loading project directory…</p>
        </div>
      </div>
    ),
  }
);

export function ProjectsTableLazy({
  initialPage,
  userRole,
}: {
  initialPage: ProjectsListPage;
  userRole: string;
}) {
  return <ProjectsTable initialPage={initialPage} userRole={userRole} />;
}
