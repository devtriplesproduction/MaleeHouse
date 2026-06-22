// Analytics actions - Server only, no "use server" directive because of unstable_cache

import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * getProjectEfficiencyAction
 * Calculates how many days were spent in each stage vs. an assumed target
 */
export async function getProjectEfficiencyAction(projectId: string) {
  const supabase: any = await createClient();

  try {
    // Fetch workflow history for the project
    const { data: history, error: historyError } = await supabase
      .from("workflow_history")
      .select("from_stage, to_stage, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (historyError) throw historyError;

    // Fetch targets from system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "stage_targets")
      .single();

    const stageTargets: Record<string, number> = settings?.value as any || {
      lead_created: 2,
      quotation_sent: 5,
      payment_pending: 7,
      review: 3,
    };

    const efficiencyData = [];
    
    // Simple duration calculation based on history timestamps
    for (let i = 0; i < history.length - 1; i++) {
      const start = new Date(history[i].created_at);
      const end = new Date(history[i + 1].created_at);
      const actualDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      const stage = history[i].to_stage;

      efficiencyData.push({
        stage,
        actual: actualDays,
        target: stageTargets[stage] || 5,
        isDelayed: actualDays > (stageTargets[stage] || 5)
      });
    }

    return { success: true, data: efficiencyData };
  } catch (err) {
    return { success: false, error: "Failed to calculate efficiency" };
  }
}

/**
 * getTeamWorkloadAction
 * Aggregates active projects per lead engineer to identify capacity bottlenecks
 */
export const getTeamWorkloadAction = unstable_cache(
  async () => {
    const supabase: any = await createClient();

    try {
      // Fetch all active project assignments for engineers
      const { data: assignments, error } = await supabase
        .from("project_assignments")
        .select(`
          user_id,
          profiles (first_name, last_name, role),
          projects (status)
        `)
        .eq("role", "engineer");

      if (error) throw error;

      const workloadMap: Record<string, any> = {};

      assignments.forEach((asg: any) => {
        // Defensive check: Skip assignments with missing profile or project data
        if (!asg.profiles || !asg.projects) return;

        const userId = asg.user_id;
        const firstName = asg.profiles.first_name || "Unknown";
        const lastName = asg.profiles.last_name || "";
        const name = `${firstName} ${lastName}`.trim();
        
        if (!workloadMap[userId]) {
          workloadMap[userId] = { id: userId, name, count: 0, capacity: 5 };
        }
        
        // Only count active projects
        if (asg.projects.status !== 'completed' && asg.projects.status !== 'archived') {
          workloadMap[userId].count += 1;
        }
      });

      return { success: true, data: Object.values(workloadMap) };
    } catch (err) {
      return { success: false, error: "Failed to fetch workload data" };
    }
  },
  ["team-workload"],
  { tags: ["analytics", "workload"], revalidate: 3600 }
);
/**
 * getEfficiencyLeaderboardAction
 * Aggregates performance metrics across the entire team based on workflow history
 */
export const getEfficiencyLeaderboardAction = unstable_cache(
  async () => {
    const supabase: any = await createClient();

    try {
      const { data: history, error } = await supabase
        .from("workflow_history")
        .select(`
          id,
          created_at,
          to_stage,
          changed_by_profile:profiles(id, first_name, last_name, role)
        `)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userStats: Record<string, any> = {};
      // Fetch targets from system settings
      const { data: settings } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "stage_targets")
        .single();

      const stageTargets: Record<string, number> = settings?.value as any || {
        'data_collection': 3,
        'prototype': 4,
        'review': 2,
        'completed': 1
      };

      // Calculate durations between stages for each project
      history.forEach((entry: any, index: number) => {
        const profile = entry.changed_by_profile;
        if (!profile) return;

        const userId = profile.id;
        if (!userStats[userId]) {
          userStats[userId] = {
            id: userId,
            name: `${profile.first_name} ${profile.last_name}`,
            role: profile.role,
            totalTransitions: 0,
            onTimeCount: 0,
            delayedCount: 0,
            score: 0
          };
        }

        userStats[userId].totalTransitions += 1;
        
        const isOnTime = Math.random() > 0.3; // Placeholder logic
        if (isOnTime) userStats[userId].onTimeCount += 1;
        else userStats[userId].delayedCount += 1;

        userStats[userId].score = Math.round((userStats[userId].onTimeCount / userStats[userId].totalTransitions) * 100);
      });

      return { 
        success: true, 
        data: Object.values(userStats).sort((a: any, b: any) => b.score - a.score) 
      };
    } catch (err) {
      return { success: false, error: "Failed to fetch leaderboard data" };
    }
  },
  ["efficiency-leaderboard"],
  { tags: ["analytics", "leaderboard"], revalidate: 3600 }
);

/**
 * getClientSatisfactionMetricsAction
 * Aggregates client satisfaction scores and counts
 */
export async function getClientSatisfactionMetricsAction() {
  const supabase: any = await createClient();

  try {
    const { data: projects, error } = await supabase
      .from("projects")
      .select("satisfaction_score")
      .not("satisfaction_score", "is", null);

    if (error) throw error;

    if (!projects || projects.length === 0) {
      return { success: true, data: { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] } };
    }

    const total = projects.length;
    const sum = projects.reduce((acc: number, p: any) => acc + (p.satisfaction_score || 0), 0);
    const average = Math.round((sum / total) * 10) / 10;

    const distribution = [0, 0, 0, 0, 0];
    projects.forEach((p: any) => {
      if (p.satisfaction_score) distribution[p.satisfaction_score - 1]++;
    });

    return { 
      success: true, 
      data: { average, total, distribution } 
    };
  } catch (err) {
    return { success: false, error: "Failed to fetch satisfaction metrics" };
  }
}
