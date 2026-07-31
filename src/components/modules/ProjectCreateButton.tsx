'use client';

import dynamic from 'next/dynamic';

// Keep the heavy wizard out of the projects page main chunk
const ProjectCreationWizard = dynamic(
  () =>
    import('@/components/modules/ProjectCreationWizard').then((m) => m.ProjectCreationWizard),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-36 rounded-xl bg-indigo-600/80 animate-pulse" aria-hidden />
    ),
  }
);

export function ProjectCreateButton() {
  return <ProjectCreationWizard />;
}
