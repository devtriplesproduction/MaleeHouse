"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/types/database.types";

type NotificationType =
  | "assignment"
  | "stage_update"
  | "approval"
  | "rejection"
  | "deadline_warning"
  | "system";

// Raw payload coming from the Supabase Realtime INSERT event
interface RealtimeNotificationPayload {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata: any;
  createdAt: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface RealtimeContextValue {
  /** Incremented each time a new notification arrives — components can react to this */
  notificationVersion: number;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  notificationVersion: 0,
});

export const useRealtimeContext = () => useContext(RealtimeContext);

// ── Toast config per notification type ───────────────────────────────────────

const NOTIFICATION_TOAST_CONFIG: Record<
  NotificationType,
  { title: string; variant: "default" | "success" | "error" | "warning" }
> = {
  assignment: { title: "📋 New Assignment", variant: "default" },
  stage_update: { title: "⚡ Stage Updated", variant: "default" },
  approval: { title: "✅ Approved", variant: "success" },
  rejection: { title: "❌ Rejected", variant: "error" },
  deadline_warning: { title: "⚠️ Deadline Warning", variant: "warning" },
  system: { title: "🔔 System Notification", variant: "default" },
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const supabase: any = createClient();
  const { toast } = useToast();
  const [notificationVersion, setNotificationVersion] = useState(0);
  const isSubscribing = useRef(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    async function subscribe() {
      if (isSubscribing.current) return;
      isSubscribing.current = true;

      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          isSubscribing.current = false;
          return;
        }

        const channelName = `notifications:user:${user.id}`;
        const channel = supabase.channel(channelName);

        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipientId=eq.${user.id}`,
          },
          (payload: any) => {
            const notification = payload.new as RealtimeNotificationPayload;
            const config = NOTIFICATION_TOAST_CONFIG[notification.type] ?? NOTIFICATION_TOAST_CONFIG.system;
            toast({
              title: config.title,
              description: notification.message,
              variant: config.variant,
            });
            setNotificationVersion((v) => v + 1);
          }
        );

        await channel.subscribe();
        channelRef.current = channel;
      } catch (err) {
        console.error("Realtime subscription error:", err);
      } finally {
        isSubscribing.current = false;
      }
    }

    subscribe();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN") {
        subscribe();
      } else if (event === "SIGNED_OUT") {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      authSubscription.unsubscribe();
    };
  }, [supabase, toast]);

  return (
    <RealtimeContext.Provider value={{ notificationVersion }}>
      {children}
    </RealtimeContext.Provider>
  );
}
