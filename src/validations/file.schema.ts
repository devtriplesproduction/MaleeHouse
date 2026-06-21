import { z } from 'zod';

export const registerFileSchema = z.object({
  project_id: z.string() || z.string().uuid(), // Supporting both UUID and custom string IDs
  category: z.enum(['quotation', 'receipt', 'requirements', 'prototype', 'survey_data', 'final_file', 'control_point_image', 'control_point_csv', 'cad_drawing']),
  file_name: z.string().min(1),
  file_url: z.string().url(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
  storage_bucket: z.string().optional(),
});

export type RegisterFileInput = z.infer<typeof registerFileSchema>;
