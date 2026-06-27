import { z } from 'zod';

export const createInvoiceSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  invoice_number: z.string().min(3, 'Invoice number is required'),
  amount: z.number().positive('Amount must be positive'),
  gst_rate: z.number().min(0, 'GST rate cannot be negative').default(18.0),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  milestone_id: z.string().min(1, 'Invalid Milestone ID').optional(),
  visit_id: z.string().min(1, 'Invalid Visit ID').optional(),
});

export const createPaymentSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  invoice_id: z.string().min(1, 'Invalid Invoice ID').optional(),
  milestone_id: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.string().min(1, 'Payment method is required'),
  transaction_id: z.string().optional(),
  receipt_url: z.string().url('Invalid receipt URL').optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
