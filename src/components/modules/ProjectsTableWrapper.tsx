import { getProjectsListAction } from '@/actions/project.actions';
import { getUserProfileAction } from '@/actions/auth.actions';
import { ProjectsTable } from './ProjectsTable';
import { SyncErrorState } from './SyncErrorState';

export async function ProjectsTableWrapper() {
  const [projectsRes, profile] = await Promise.all([
    getProjectsListAction(),
    getUserProfileAction()
  ]);

  if (!projectsRes || !projectsRes.success || projectsRes.error) {
    console.error('Error fetching projects:', projectsRes?.error);
    return <SyncErrorState />;
  }

  // Pass data and role to Client Component for rendering
  return <ProjectsTable initialProjects={projectsRes.data || []} userRole={profile?.role || 'admin'} />;
}
