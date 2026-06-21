"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { usePathname } from "next/navigation";

export interface PresenceUser {
  userId: string;
  name: string;
  role: string;
  currentPath: string;
  onlineAt: string;
}

export function usePresence() {
  const supabase: any = createClient();
  const { user, role } = useUser();
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user) return;

    // ── 1. Set up the presence channel ─────────────────────────────────────────
    const channel = supabase.channel("online_users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // ── 2. Handle presence sync ───────────────────────────────────────────────
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];

        // Flatten the presence state (Supabase returns an array for each key)
        Object.keys(state).forEach((key) => {
          const presenceEntries = state[key] as any[];
          if (presenceEntries.length > 0) {
            users.push({
              userId: key,
              ...presenceEntries[0],
            });
          }
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status: any) => {
        if (status === "SUBSCRIBED") {
          // ── 3. Track current user's metadata ──────────────────────────────────
          await channel.track({
            name: user.name || user.email,
            role: role || "Member",
            currentPath: pathname,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, role, pathname, supabase]);

  return {
    onlineUsers,
    count: onlineUsers.length,
    // Helper to filter users by a specific project ID path
    viewingProject: (projectId: string) =>
      onlineUsers.filter((u) => u.currentPath.includes(projectId) && u.userId !== user?.id),
  };
}
