import { z } from 'zod';

export const quotationItemSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  hsn_code: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  total: z.number().min(0),
});

export const createQuotationSchema = z.object({
  project_id: z.string().nullable().optional(),
  quotation_number: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  discount_pct: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  gst_rate: z.number().default(18),
  gst_amount: z.number().min(0),
  total_amount: z.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  clauses: z.array(z.any()).optional(),
  assigned_to: z.string().optional(),
  bank_id: z.string().optional(),
  client_details: z.object({
    company_name: z.string().optional(),
    contact_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    project_title: z.string().optional(),
    gst_type: z.enum(['CGST_SGST', 'IGST', 'NO_GST']).optional(),
  }).optional(),
  internal_notes: z.object({
    pricing_discussions: z.array(z.string()).default([]),
    margin_notes: z.string().default(''),
    finance_notes: z.string().default(''),
  }).optional(),
});


export const updateQuotationStatusSchema = z.object({
  id: z.string().min(1, 'Quotation ID is required'),
  status: z.enum(['Pending', 'Draft', 'Sent', 'Viewed', 'Approved', 'Rejected', 'Expired', 'Revision Requested']),
  comment: z.string().optional(),
  rejection_category: z.enum(['budget', 'scope', 'timeline', 'modification', 'other']).optional(),
  rejection_reason: z.string().optional(),
});

export type QuotationItem = z.infer<typeof quotationItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
