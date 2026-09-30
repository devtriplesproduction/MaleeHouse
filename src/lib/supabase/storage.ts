import { uploadFileToServerAction } from '@/actions/storage.actions';

export async function uploadProjectFile(
  file: File,
  projectId: string,
  bucket: string = 'project-assets'
) {
  const formData = new FormData();
  formData.append('file', file);
  
  const result = await uploadFileToServerAction(formData, projectId, bucket);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Upload failed');
  }

  return {
    publicUrl: result.data.publicUrl,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size
  };
}
