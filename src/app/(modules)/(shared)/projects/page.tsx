import React, { Suspense } from 'react';
import { ProjectCreationWizard } from '@/components/modules/ProjectCreationWizard';
import { getUserProfileAction } from '@/actions/auth.actions';
import { ProjectsTableWrapper } from '@/components/modules/ProjectsTableWrapper';
import { Briefcase, FolderKanban } from 'lucide-react';
import { getAllOverrideRequestsAction } from '@/actions/workflow.actions';
import { DispatchOverridesTable } from '@/components/modules/DispatchOverridesTable';

async function DispatchOverridesTableWrapper() {
  const result = await getAllOverrideRequestsAction();
  return <DispatchOverridesTable requests={result.data || []} />;
}

export const metadata = {
  title: 'Project Directory | Survey Workflow',
  description: 'Manage active projects and initiate new survey workflows.',
};

function TableSkeleton() {
  return (
    <div className="w-full h-[500px] glass-card flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-indigo-500/40 to-purple-500/30 animate-pulse" />
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-[3px] border-indigo-500/10 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-indigo-500/50" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            Intelligence Retrieval
          </p>
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Synchronizing project directory...
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const profile = await getUserProfileAction();
  const role = profile?.role;

  return (
    <div className="animate-in fade-in duration-500 pb-20 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Icon badge */}
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Project Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Track ongoing workflows and initiate new survey projects.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        {role !== 'engineer' && (
          <div className="flex-shrink-0">
            <ProjectCreationWizard />
          </div>
        )}
      </div>




      {/* ── Full-Width Projects Table ── */}
      <Suspense fallback={<TableSkeleton />}>
        <ProjectsTableWrapper />
      </Suspense>

      {/* ── Dispatch Overrides Table ── */}
      {role === 'admin' && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight px-1">
            Dispatch Overrides History
          </h3>
          <Suspense fallback={<div className="h-[200px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />}>
            <DispatchOverridesTableWrapper />
          </Suspense>
        </div>
      )}

    </div>
  );
}
