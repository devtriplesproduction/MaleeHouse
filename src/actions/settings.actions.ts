"use server";

import { normalizeData } from '@/lib/normalize';
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
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
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: "company-settings-1",
  name: "Malee House Head Office",
  address: "4th Floor, Alpha Block, Sigma Tech Park",
  cityStateZip: "Whitefield, Bangalore, Karnataka 560066",
  gstin: "36AAAAA1111A1Z1",
  telephone: "+91 80 4987 6543",
  mobile: "+91 98765 43210",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  upiId: ""
};

const SETTINGS_SELECT =
  'id, name, address, cityStateZip, gstin, telephone, mobile, bankName, accountName, accountNumber, ifscCode, branchName, upiId';

/**
 * Server-side company settings load (no cookies — safe for unstable_cache).
 * Uses service role so public invoice/receipt pages work without exposing
 * company_settings (GSTIN, bank details) to the anon Supabase REST role.
 */
async function fetchCompanySettingsFromDb(): Promise<CompanySettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return DEFAULT_COMPANY_SETTINGS;

  const supabase = createAnonClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await supabase
    .from("company_settings")
    .select(SETTINGS_SELECT)
    .limit(1);

  if (data && data.length > 0) return data[0] as CompanySettings;
  return DEFAULT_COMPANY_SETTINGS;
}

const getCrossRequestCompanySettings = unstable_cache(
  fetchCompanySettingsFromDb,
  ["company-settings-v2"],
  { revalidate: 300, tags: ["company-settings"] }
);

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

// Per-request + cross-request cache: layout no longer hits DB every navigation.
const getCachedCompanySettings = cache(async (): Promise<CompanySettings> => {
  try {
    return await getCrossRequestCompanySettings();
  } catch (err) {
    console.error("Error reading company settings:", err);
    return DEFAULT_COMPANY_SETTINGS;
  }
});

export async function getCompanySettingsAction(): Promise<CompanySettings> {
  return await getCachedCompanySettings();
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

    revalidateTag("company-settings");
    revalidatePath("/accounts");
    revalidatePath("/projects");
    revalidatePath("/settings/details");
    return { success: true, data: normalizeData(updatedSettings) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update settings" };
  }
}