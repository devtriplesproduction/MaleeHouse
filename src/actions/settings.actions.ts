"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserProfileAction } from "./auth.actions";

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  cityStateZip: string;
  gstin: string;
  telephone: string;
  mobile: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: "company-settings-1",
  name: "Malee House Head Office",
  address: "4th Floor, Alpha Block, Sigma Tech Park",
  cityStateZip: "Whitefield, Bangalore, Karnataka 560066",
  gstin: "36AAAAA1111A1Z1",
  telephone: "+91 80 4987 6543",
  mobile: "+91 98765 43210"
};

const stageTargetsSchema = z.record(z.string(), z.number());
const orgProfileSchema = z.object({
  company_name: z.string(),
  support_contact: z.string().email(),
  primary_color: z.string().optional(),
});

const systemPreferencesSchema = z.object({
  currency: z.string(),
  timezone: z.string(),
  date_format: z.string(),
});

const notificationSettingsSchema = z.object({
  email_on_new_project: z.boolean(),
  email_on_task_assigned: z.boolean(),
  email_on_qc_rejection: z.boolean(),
  email_on_payment_milestone: z.boolean(),
});

export async function getSystemSettingsAction(key: string) {
  const supabase: any = await createClient();

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error) throw error;
    return { success: true, data: data.value };
  } catch (err) {
    console.error(`Error fetching setting ${key}:`, err);
    return { success: false, error: "Failed to fetch system settings" };
  }
}

export async function updateSystemSettingsAction(key: string, value: any) {
  const supabase: any = await createClient();

  try {
    // Validation
    if (key === 'stage_targets') {
      stageTargetsSchema.parse(value);
    } else if (key === 'org_profile') {
      orgProfileSchema.parse(value);
    } else if (key === 'system_preferences') {
      systemPreferencesSchema.parse(value);
    } else if (key === 'notification_settings') {
      notificationSettingsSchema.parse(value);
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'key' });

    if (error) throw error;

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error(`Error updating setting ${key}:`, err);
    return { success: false, error: err.message || "Failed to update settings" };
  }
}

/**
 * getSystemHealthAction
 * Verifies connectivity to core services
 */
export async function getSystemHealthAction() {
  const supabase: any = await createClient();

  try {
    const start = Date.now();
    
    // Check DB + Auth
    const [dbCheck, authCheck] = await Promise.all([
      supabase.from("system_settings").select("key").limit(1),
      supabase.auth.getSession()
    ]);

    const latency = Date.now() - start;

    const isHealthy = !dbCheck.error && !authCheck.error;

    return {
      success: true,
      data: {
        status: isHealthy ? "operational" : "degraded",
        latency: `${latency}ms`,
        services: {
          database: !dbCheck.error ? "healthy" : "error",
          auth: !authCheck.error ? "healthy" : "error",
          storage: "healthy" // Placeholder for storage check
        },
        lastChecked: new Date().toISOString()
      }
    };
  } catch (err) {
    return {
      success: false,
      data: {
        status: "down",
        services: { database: "error", auth: "error", storage: "error" }
      }
    };
  }
}

export async function getCompanySettingsAction(): Promise<CompanySettings> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase.from('company_settings').select('*').limit(1);

    if (data && data.length > 0) {
      return data[0] as CompanySettings;
    }
    
    // Create it with default if it doesn't exist (Only if Admin or Accountant)
    const profile: any = await getUserProfileAction();
    if (profile && (profile.role === "admin" || profile.role === "accountant")) {
      await supabase.from('company_settings').insert([DEFAULT_COMPANY_SETTINGS]);
    }
    return DEFAULT_COMPANY_SETTINGS;
  } catch (err) {
    console.error("Error reading company settings:", err);
    return DEFAULT_COMPANY_SETTINGS;
  }
}

export async function updateCompanySettingsAction(settings: Partial<CompanySettings>) {
  const profile: any = await getUserProfileAction();
  if (!profile || (profile.role !== "admin" && profile.role !== "accountant")) {
    return { success: false, error: "Unauthorized access. Only Admins and Accountants can update settings." };
  }

  try {
    const currentSettings = await getCompanySettingsAction();
    const updatedSettings = { ...currentSettings, ...settings };
    
    const supabase: any = await createClient();
    const { error } = await supabase
      .from('company_settings')
      .update(updatedSettings)
      .eq('id', currentSettings.id);

    if (error) throw error;

    revalidatePath("/admin/settings");
    revalidatePath("/accounts");
    revalidatePath("/projects");
    return { success: true, data: updatedSettings };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update settings" };
  }
}
