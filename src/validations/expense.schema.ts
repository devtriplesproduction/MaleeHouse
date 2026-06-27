import { z } from 'zod';

export const createExpenseSchema = z.object({
  project_id: z.string().nullable().optional(),
  category: z.enum(['labor', 'material', 'travel', 'overhead', 'other'], {
    errorMap: () => ({ message: "Category must be one of: labor, material, travel, overhead, other" })
  }),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  expense_date: z.string().min(1, 'Expense date is required'),
  receipt_url: z.string().url('Invalid receipt URL').or(z.literal('')).nullable().optional(),
});

export const updateExpenseSchema = z.object({
  id: z.string().uuid('Invalid Expense ID'),
  project_id: z.string().nullable().optional(),
  category: z.enum(['labor', 'material', 'travel', 'overhead', 'other'], {
    errorMap: () => ({ message: "Category must be one of: labor, material, travel, overhead, other" })
  }).optional(),
  description: z.string().min(1, 'Description is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  expense_date: z.string().optional(),
  receipt_url: z.string().url('Invalid receipt URL').or(z.literal('')).nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
