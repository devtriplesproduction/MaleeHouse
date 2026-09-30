import { getProjectsListAction, type ProjectsListPage } from '@/actions/project.actions';
import { getUserProfileAction } from '@/actions/auth.actions';
import { ProjectsTableLazy } from './ProjectsTableLazy';
import { SyncErrorState } from './SyncErrorState';

const PAGE_SIZE = 10;

export async function ProjectsTableWrapper() {
  const [projectsRes, profile] = await Promise.all([
    getProjectsListAction({ page: 1, pageSize: PAGE_SIZE }),
    getUserProfileAction(),
  ]);

  if (!projectsRes || !projectsRes.success || projectsRes.error) {
    console.error('Error fetching projects:', projectsRes?.error);
    return <SyncErrorState />;
  }

  const pageData = projectsRes.data as ProjectsListPage;

  // Client table is code-split; first page is still SSR-hydrated via props
  return (
    <ProjectsTableLazy
      initialPage={pageData}
      userRole={profile?.role || 'admin'}
    />
  );
}
