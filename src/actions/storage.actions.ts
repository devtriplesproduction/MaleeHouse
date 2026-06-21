'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function uploadFileToServerAction(
  formData: FormData,
  projectId: string,
  bucket: string = 'project-assets'
) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const supabaseAdmin = createAdminClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    // Upload using Admin Client to bypass missing Storage RLS
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl
      }
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return { success: false, error: error.message };
  }
}
