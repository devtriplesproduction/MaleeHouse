'use client'

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createProjectSchema, type CreateProjectInput } from "../validations"
import { createProject } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function CreateProjectForm() {
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      client_name: "",
      target_completion_date: "",
    },
  })

  async function onSubmit(data: CreateProjectInput) {
    setIsPending(true)
    setError(null)
    
    const result = await createProject(data)
    
    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : "Validation failed")
      setIsPending(false)
    } else {
      // Handle success (e.g. redirect or show success message)
      window.location.href = `/projects/${result.data.id}`
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Initiate New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Project Name</label>
            <Input 
              {...form.register("name")} 
              placeholder="e.g. Skyline Survey Phase 1"
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Client Name</label>
            <Input 
              {...form.register("client_name")} 
              placeholder="e.g. Acme Corp"
              disabled={isPending}
            />
            {form.formState.errors.client_name && (
              <p className="text-xs text-red-500">{form.formState.errors.client_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Target Completion Date</label>
            <Input 
              {...form.register("target_completion_date")} 
              type="date"
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
