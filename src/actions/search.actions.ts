"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * globalSearchAction
 * Performs a broad text search across projects, profiles, and tasks
 */
export async function globalSearchAction(query: string) {
  if (!query || query.length < 2) {
    return { projects: [], users: [], tasks: [] };
  }

  const supabase: any = await createClient();
  const searchTerm = `%${query}%`;

  try {
    // 1. Search Projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, client_name, status")
      .or(`name.ilike.${searchTerm},client_name.ilike.${searchTerm}`)
      .limit(5);

    // 2. Search Users (Profiles)
    const { data: users } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, email")
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .eq("is_active", true)
      .limit(5);

    // 3. Search Tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, project_id, status")
      .ilike("title", searchTerm)
      .limit(5);

    return {
      projects: projects || [],
      users: users || [],
      tasks: tasks || [],
    };
  } catch (err) {
    console.error("Search error:", err);
    return { projects: [], users: [], tasks: [] };
  }
}
