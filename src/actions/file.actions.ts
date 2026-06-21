'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { registerFileSchema, type RegisterFileInput } from '@/validations/file.schema';
import type { ActionResponse } from './project.actions';
import { getUserProfileAction } from './auth.actions';
import { notifySupplementalUploadAction } from './notification.actions';

export async function registerFileAction(payload: RegisterFileInput): Promise<ActionResponse> {
  try {
    const validatedFields = registerFileSchema.safeParse(payload);
    
    if (!validatedFields.success) {
      return { 
        success: false, 
        error: validatedFields.error.errors[0]?.message || 'Validation failed.' 
      };
    }
    const profile: any = await getUserProfileAction();
    if (!profile || !profile.id) {
      return { success: false, error: 'Unauthorized. Please log in to upload files.' };
    }
    const userId = profile.id;

    const supabase: any = await createClient();

    // 1. Enforce Freeze and Payment Holds
    const { data: project } = await supabase
      .from('projects')
      .select('is_frozen')
      .eq('id', validatedFields.data.project_id)
      .single();
      
    if (project?.is_frozen) {
      return { 
        success: false, 
        error: "Upload Blocked: Project operations are frozen due to outstanding payments." 
      };
    }

    const categoryFolders: Record<string, string> = {
      quotation: 'quotation',
      receipt: 'receipt',
      requirements: 'requirements',
      prototype: 'cad',
      cad_drawing: 'cad',
      survey_data: 'field-data',
      control_point_image: 'field-data',
      control_point_csv: 'field-data',
      final_file: 'deliverables'
    };
    const folder = categoryFolders[validatedFields.data.category] || 'misc';
    const enforcedPath = `${validatedFields.data.project_id}/${folder}/${validatedFields.data.file_name}`;

    const newFileRecord = {
      id: crypto.randomUUID(),
      project_id: validatedFields.data.project_id,
      category: validatedFields.data.category,
      file_name: validatedFields.data.file_name,
      file_url: validatedFields.data.file_url || '',
      mime_type: validatedFields.data.mime_type || 'application/pdf',
      file_size_bytes: validatedFields.data.file_size || 1024,
      uploaded_by: userId,
      uploaded_at: new Date().toISOString(),
    };

    const { data: insertedFile, error: insertError } = await supabase
      .from('files')
      .insert(newFileRecord)
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await supabase.from("workflow_history").insert({
      project_id: validatedFields.data.project_id,
      changed_by: userId,
      comment: `Uploaded file: ${validatedFields.data.file_name} (${validatedFields.data.category})`,
      created_at: new Date().toISOString()
    });

    await supabase.from("activity_logs").insert({
      project_id: validatedFields.data.project_id,
      user_id: userId,
      action: "FILE_UPLOADED",
      details: { file_name: validatedFields.data.file_name, category: validatedFields.data.category },
      created_at: new Date().toISOString()
    });

    try {
      await notifySupplementalUploadAction(validatedFields.data.project_id);
    } catch (e) {
      console.error("Failed to notify supplemental upload", e);
    }

    revalidatePath(`/projects/${validatedFields.data.project_id}`);

    return { success: true, data: insertedFile };
  } catch (error: any) {
    return { success: false, error: error?.message || 'An unexpected error occurred.' };
  }
}

export async function getProjectFilesAction(projectId: string): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        profiles:uploaded_by (
          first_name,
          last_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch files:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'An unexpected error occurred.' };
  }
}


export async function deleteFileAction(fileId: string, projectId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabaseAdmin = createAdminClient();

    // 1. Get the file URL to delete from storage
    const { data: fileData, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('file_url')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileData) {
      return { success: false, error: 'File not found.' };
    }

    // Extract storage path from the public URL
    // URL format: .../storage/v1/object/public/project-assets/projectId/fileName
    const urlParts = (fileData as any).file_url.split('/project-assets/');
    if (urlParts.length === 2) {
      const storagePath = decodeURIComponent(urlParts[1]);
      await supabaseAdmin.storage.from('project-assets').remove([storagePath]);
    }

    // 2. Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return { success: false, error: error?.message || 'Failed to delete file.' };
  }
}
