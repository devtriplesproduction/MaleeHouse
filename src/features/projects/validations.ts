import * as z from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  client_name: z.string().min(2, "Client name is required"),
  target_completion_date: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
