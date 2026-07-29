"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { HireDeveloperFormValues, GetQuoteFormValues } from "@/validations/lead-schema";

export async function submitHireDeveloperForm(data: HireDeveloperFormValues) {
  try {
    const supabase = await createClient();
    
    // Validate data against schema (optional here since we validate on client, but good practice)
    
    const { error } = await (supabase.from('leads') as any)
      .insert([
        {
          type: 'hire_developer',
          name: data.name,
          company: data.company,
          email: data.email,
          country: data.country,
          technology: data.technology,
          experience: data.experience,
          duration: data.duration,
          start_date: data.startDate,
          budget: data.budget,
          description: data.description,
          created_at: new Date().toISOString(),
          status: 'new'
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit hire developer form:", error);
    return { success: false, error: error.message || "Failed to submit form." };
  }
}

export async function submitGetQuoteForm(data: GetQuoteFormValues) {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase.from('leads') as any)
      .insert([
        {
          type: 'get_quote',
          project_name: data.projectName,
          email: data.email,
          budget: data.budget,
          timeline: data.timeline,
          requirement: data.requirement,
          attachment_url: data.attachmentUrl || null,
          created_at: new Date().toISOString(),
          status: 'new'
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit get quote form:", error);
    return { success: false, error: error.message || "Failed to submit form." };
  }
}
