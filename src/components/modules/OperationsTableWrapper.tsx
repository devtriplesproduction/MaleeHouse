import { createClient } from '@/lib/supabase/server';
import { OperationsTable } from './OperationsTable';
import { SyncErrorState } from './SyncErrorState';

export async function OperationsTableWrapper() {
  const supabase: any = await createClient();
  
  // Fetch projects in operational stages with their assignments and latest files
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_assignments (
        id,
        user_id,
        role,
        profiles:user_id (
          first_name,
          last_name,
          role
        )
      ),
      files (
        id,
        category,
        uploaded_at,
        file_name
      )
    `)
    .neq('status', 'archived')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching operations data:', error);
    return <SyncErrorState />;
  }

  return <OperationsTable initialProjects={projects || []} />;
}
