"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BroadcastType = "info" | "urgent" | "maintenance" | "success";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function sendSystemBroadcastAction(
  title: string,
  message: string,
  type: BroadcastType = "info"
): Promise<ActionResult> {
  const supabase: any = await createClient();

  // 1. Auth & Admin Gate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Authentication required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Unauthorized. Only admins can send broadcasts." };
  }

  // 2. Insert into a dedicated broadcasts table
  // Note: Assuming a 'broadcasts' table exists or creating a system notification 
  // that isn't tied to a specific user_id if the schema allows.
  // For this implementation, we'll use a specific channel event in Realtime, 
  // but we'll also log it for history.
  const { error: insertError } = await supabase.from("notifications").insert({
    title: `📢 ${title}`,
    message,
    type: "system",
    user_id: null, // We'll update the RLS/Schema to allow null for global broadcasts
    is_read: false,
  });

  if (insertError) {
    console.error("[sendSystemBroadcast] error:", insertError);
    return { success: false, error: "Failed to dispatch broadcast." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
