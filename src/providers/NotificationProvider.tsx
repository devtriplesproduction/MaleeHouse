"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useTransition } from "react";
import { useRealtimeContext } from "@/providers/RealtimeProvider";
import { getNotificationsAction, markNotificationAsReadAction, clearAllNotificationsAction, type NotificationItem } from "@/actions/notification.actions";

interface NotificationContextType {
  notifications: NotificationItem[];
  isLoading: boolean;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
  children,
  initialNotifications,
}: {
  children: React.ReactNode;
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { notificationVersion } = useRealtimeContext();

  // Load once on mount (layout no longer SSR-fetches every navigation),
  // then again only when Realtime bumps notificationVersion.
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    let isMounted = true;
    async function load() {
      // Skip redundant first fetch only when SSR already provided items
      if (isInitialMount.current) {
        isInitialMount.current = false;
        if (initialNotifications.length > 0) return;
      }
      setIsLoading(true);
      try {
        const result = await getNotificationsAction();
        if (isMounted && result && result.success && result.data) {
          setNotifications(result.data.filter((n: any) => !n.related_project_id));
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [notificationVersion, initialNotifications.length]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    startTransition(async () => {
      await markNotificationAsReadAction(id);
    });
  };

  const clearAll = () => {
    setNotifications([]);
    startTransition(async () => {
      await clearAllNotificationsAction();
    });
  };

  const contextValue = useMemo(() => ({
    notifications,
    isLoading,
    markAsRead,
    clearAll,
  }), [notifications, isLoading]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
