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
    const { data: profiles } = await supabase.from('profiles').select('*');
    
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
