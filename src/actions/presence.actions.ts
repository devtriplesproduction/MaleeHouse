"use server";

import { LOCAL_USERS } from "@/lib/local-db";

export interface TeamMemberSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  email: string;
}

export async function getTeamPresenceSummaryAction() {
  try {
    const summary: TeamMemberSummary[] = LOCAL_USERS.map((p) => ({
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
