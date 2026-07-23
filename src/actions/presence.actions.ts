"use server";

import { createClient } from "@/lib/supabase/server";

export interface TeamMemberSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  email: string;
}

export async function getTeamPresenceSummaryAction() {
  try {
    const supabase = await createClient();
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role, phone, is_active, status, created_at, updated_at, deleted_at, profile_image_url, department_id, reporting_manager_id');
    
    if (!profiles) return [];
    
    const summary: TeamMemberSummary[] = profiles.map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.role,
      email: p.email,
    }));
    return summary;
  } catch (error) {
    console.error("[getTeamPresenceSummaryAction] error:", error);
    return [];
  }
}
