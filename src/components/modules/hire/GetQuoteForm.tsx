"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getQuoteSchema, GetQuoteFormValues } from "@/validations/lead-schema";
import { submitGetQuoteForm } from "@/actions/lead.actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";

export const GetQuoteForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GetQuoteFormValues>({
    resolver: zodResolver(getQuoteSchema),
  });

  const attachmentUrl = watch("attachmentUrl");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset");
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error("Cloudinary cloud name is not configured");
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setValue("attachmentUrl", data.secure_url);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setValue("attachmentUrl", "");
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: GetQuoteFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await submitGetQuoteForm(data);
      if (result.success) {
        toast.success("Quote request submitted successfully!");
        reset();
        removeFile();
      } else {
        toast.error(result.error || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to submit quote request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="get-quote" className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-8">
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Request a Quote</h3>
      <p className="text-slate-600 mb-6">Have a specific project in mind? Let us know the details.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input id="projectName" placeholder="E-commerce Redesign" {...register("projectName")} />
          {errors.projectName && <p className="text-sm text-red-500">{errors.projectName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailQuote">Work Email</Label>
          <Input id="emailQuote" type="email" placeholder="john@example.com" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="timelineQuote">Timeline</Label>
            <select 
              id="timelineQuote" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("timeline")}
            >
              <option value="">Select timeline</option>
              <option value="Urgent (ASAP)">Urgent (ASAP)</option>
              <option value="1-3 Months">1-3 Months</option>
              <option value="3-6 Months">3-6 Months</option>
              <option value="Flexible">Flexible</option>
            </select>
            {errors.timeline && <p className="text-sm text-red-500">{errors.timeline.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetQuote">Estimated Budget</Label>
            <select 
              id="budgetQuote" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("budget")}
            >
              <option value="">Select budget range</option>
              <option value="Less than $5,000">Less than $5,000</option>
              <option value="$5,000 - $15,000">$5,000 - $15,000</option>
              <option value="$15,000 - $50,000">$15,000 - $50,000</option>
              <option value="More than $50,000">More than $50,000</option>
            </select>
            {errors.budget && <p className="text-sm text-red-500">{errors.budget.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirement">Project Requirements</Label>
          <Textarea 
            id="requirement" 
            placeholder="Please provide an overview of your project, key features, and any other relevant details." 
            className="min-h-[100px]"
            {...register("requirement")} 
          />
          {errors.requirement && <p className="text-sm text-red-500">{errors.requirement.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Attachments (Optional)</Label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-upload" 
            />
            <Label 
              htmlFor="file-upload" 
              className="cursor-pointer flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded-md hover:bg-slate-100 transition-colors text-sm text-slate-600"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Attach File"}
            </Label>
            
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md">
                <span className="truncate max-w-[150px]">{fileName}</span>
                <button type="button" onClick={removeFile} className="text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <Input type="hidden" {...register("attachmentUrl")} />
        </div>

        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Submitting..." : "Get Free Quote"}
        </Button>
      </form>
    </div>
  );
};
