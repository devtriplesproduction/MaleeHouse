import * as z from "zod";

export const hireDeveloperSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  company: z.string().min(2, "Company name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  country: z.string().min(2, "Country is required."),
  technology: z.string().min(1, "Please select a technology."),
  experience: z.string().min(1, "Please select the required experience level."),
  duration: z.string().min(1, "Please specify the engagement duration."),
  startDate: z.string().min(1, "Please specify when you need to start."),
  budget: z.string().min(1, "Please select a budget range."),
  description: z.string().min(10, "Please provide more details about your project requirements (min 10 characters)."),
});

export type HireDeveloperFormValues = z.infer<typeof hireDeveloperSchema>;

export const getQuoteSchema = z.object({
  projectName: z.string().min(2, "Project name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  budget: z.string().min(1, "Please select a budget range."),
  timeline: z.string().min(1, "Please select a timeline."),
  requirement: z.string().min(10, "Please describe your requirement (min 10 characters)."),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
});

export type GetQuoteFormValues = z.infer<typeof getQuoteSchema>;
