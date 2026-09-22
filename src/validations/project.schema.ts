import { z } from 'zod';

import { isValidPhoneNumber } from 'libphonenumber-js';

import disposableDomains from 'disposable-email-domains';

const FAKE_DOMAINS = [
  'test.com', 'example.com', 'fake.com', 'demo.com', 'sample.com', 
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com',
  'tempmail.com', 'throwawaymail.com', 'temp-mail.org', 'fake-mail.com',
  '123.com', 'abc.com', 'xyz.com', 'domain.com', 'email.com', 'asdf.com',
  'qwer.com', 'zxcv.com', 'fakemail.net', 'spam.com', 'nobody.com'
];

export const createProjectSchema = z.object({
  name: z.string().min(3, { message: 'Project name must be at least 3 characters.' }),
  client_name: z.string().min(2, { message: 'Client name must be at least 2 characters.' }),
  gst_number: z.string().optional(),
  phone: z.string().refine((val) => {
    try {
      return isValidPhoneNumber(val);
    } catch {
      return false;
    }
  }, { message: 'Please enter a valid phone number.' }),
  email: z.union([
    z.literal(''),
    z.string().trim().email({ message: 'Please enter a valid email address.' }).refine((val) => {
      const domain = val.split('@')[1];
      if (!domain) return true;
      const lowerDomain = domain.toLowerCase();
      if (FAKE_DOMAINS.includes(lowerDomain)) return false;
      return !disposableDomains.includes(lowerDomain);
    }, { message: 'Please provide a valid, non-temporary business or personal email.' })
  ]).optional(),
  client_contact: z.string().optional(),
  client_address: z.string().min(10, { message: 'Full address is required.' }),
  state_code: z.string().min(2).max(2, { message: 'State code must be exactly 2 letters (e.g., TX, NY).' }).toUpperCase(),
  site_coordinates: z.string().optional(),
  site_type: z.enum(['residential', 'commercial', 'industrial', 'infrastructure', 'other']),
  survey_requirements: z.string().min(10, { message: 'Please provide more details on requirements.' }),
  services: z.array(z.string()).min(1, { message: 'Select at least one service.' }),
  target_completion_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      {
        message: 'Target completion date must be a valid today or future date.',
      }
    ),
  channel: z.enum(['direct', 'vendor']).optional().default('direct'),
  vendor_id: z.string().uuid().optional().nullable(),
  vendor_intake: z.enum(['needs_prototype', 'survey_and_prototype_ready']).optional().nullable(),
  vendor_pay_when: z.enum(['on_create', 'on_deliver']).optional().nullable(),
  activation_amount: z.number().nonnegative().optional(),
}).superRefine((val, ctx) => {
  if ((val.channel ?? 'direct') !== 'vendor') return;
  if (!val.vendor_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vendor is required for vendor-channel projects.', path: ['vendor_id'] });
  if (!val.vendor_intake) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vendor intake type is required.', path: ['vendor_intake'] });
  if (!val.vendor_pay_when) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vendor payment timing is required.', path: ['vendor_pay_when'] });
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['lead_created', 'quotation_sent', 'payment_pending', 'payment_done', 'ready_for_dispatch', 'project_created', 'data_collection', 'prototype', 'review', 'field_work', 'data_sync', 'final_review', 'completed']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
