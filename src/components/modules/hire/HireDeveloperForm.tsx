"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hireDeveloperSchema, HireDeveloperFormValues } from "@/validations/lead-schema";
import { submitHireDeveloperForm } from "@/actions/lead.actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HireTechnologyConfig } from "@/types/hire-technology";

interface HireDeveloperFormProps {
  config: HireTechnologyConfig;
}

export const HireDeveloperForm: React.FC<HireDeveloperFormProps> = ({ config }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HireDeveloperFormValues>({
    resolver: zodResolver(hireDeveloperSchema),
    defaultValues: {
      technology: config.name,
    }
  });

  const onSubmit = async (data: HireDeveloperFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await submitHireDeveloperForm(data);
      if (result.success) {
        toast.success("Request submitted successfully! We'll get back to you shortly.");
        reset();
      } else {
        toast.error(result.error || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="hire-form" className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Hire {config.name} Developers</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Acme Inc" {...register("company")} />
            {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="United States" {...register("country")} />
            {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Required Experience</Label>
            <select 
              id="experience" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("experience")}
            >
              <option value="">Select experience level</option>
              <option value="Junior (1-3 yrs)">Junior (1-3 yrs)</option>
              <option value="Mid-Level (3-5 yrs)">Mid-Level (3-5 yrs)</option>
              <option value="Senior (5+ yrs)">Senior (5+ yrs)</option>
              <option value="Lead/Architect">Lead/Architect</option>
            </select>
            {errors.experience && <p className="text-sm text-red-500">{errors.experience.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Engagement Duration</Label>
            <select 
              id="duration" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("duration")}
            >
              <option value="">Select duration</option>
              <option value="Less than 1 month">Less than 1 month</option>
              <option value="1 to 3 months">1 to 3 months</option>
              <option value="3 to 6 months">3 to 6 months</option>
              <option value="More than 6 months">More than 6 months</option>
            </select>
            {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <select 
              id="startDate" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("startDate")}
            >
              <option value="">Select start date</option>
              <option value="Immediately">Immediately</option>
              <option value="Within 1-2 weeks">Within 1-2 weeks</option>
              <option value="Within a month">Within a month</option>
              <option value="Not sure yet">Not sure yet</option>
            </select>
            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget</Label>
            <select 
              id="budget" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("budget")}
            >
              <option value="">Select budget range</option>
              <option value="Less than $3,000">Less than $3,000</option>
              <option value="$3,000 - $5,000">$3,000 - $5,000</option>
              <option value="$5,000 - $10,000">$5,000 - $10,000</option>
              <option value="More than $10,000">More than $10,000</option>
            </select>
            {errors.budget && <p className="text-sm text-red-500">{errors.budget.message}</p>}
          </div>
        </div>

        <div className="space-y-2 hidden">
          <Input type="hidden" {...register("technology")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Project Description</Label>
          <Textarea 
            id="description" 
            placeholder="Tell us about your project, specific requirements, and the role you are looking to fill." 
            className="min-h-[120px]"
            {...register("description")} 
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </div>
  );
};
