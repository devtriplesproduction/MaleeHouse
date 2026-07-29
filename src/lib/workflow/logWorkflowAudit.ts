import { SupabaseClient } from '@supabase/supabase-js';

export async function logWorkflowAudit(
  supabase: any,
  projectId: string,
  changedBy: string,
  comment: string
) {
  const { data: project, error: projError } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single();

  if (projError || !project?.status) {
    throw new Error("Project not found or status missing for audit log");
  }

  const { error: insertError } = await supabase.from('workflow_history').insert({
    id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    project_id: projectId,
    to_stage: project.status,
    changed_by: changedBy,
    comment,
    created_at: new Date().toISOString()
  });

  if (insertError) {
    throw insertError;
  }
}
