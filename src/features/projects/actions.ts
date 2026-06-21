'use server'

import { createClient } from '@/lib/supabase/server'
import { createProjectSchema, type CreateProjectInput } from './validations'
import { revalidatePath } from 'next/cache'

export async function createProject(input: CreateProjectInput) {
  const supabase: any = await createClient()
  
  // 1. Validate Input
  const validated = createProjectSchema.safeParse(input)
  if (!validated.success) {
    return { error: validated.error.format() }
  }

  // 2. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  try {
    // 3. Generate Project ID (e.g., PRJ + sequence)
    // Note: We use a RPC or direct query to get the nextval
    const { data: nextId, error: seqError } = await supabase
      .rpc('get_next_project_id') // We will need to create this function in Supabase

    if (seqError) {
      console.error("Sequence error:", seqError)
      // Fallback or handle error
      throw new Error("Failed to generate project ID")
    }

    // 4. Insert Project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: nextId,
        name: validated.data.name,
        client_name: validated.data.client_name,
        target_completion_date: validated.data.target_completion_date || null,
        status: 'lead_created'
      })
      .select()
      .single()

    if (projectError) throw projectError

    // 5. Initial Workflow History
    await supabase.from('workflow_history').insert({
      project_id: nextId,
      to_stage: 'lead_created',
      changed_by: user.id,
      comment: 'Project initialized'
    })

    revalidatePath('/sales')
    return { data: project }

  } catch (error: any) {
    return { error: error.message || "Failed to create project" }
  }
}
