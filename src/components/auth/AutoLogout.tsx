"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth.actions";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function AutoLogout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const logout = async () => {
      try {
        await signOutAction();
      } catch (err) {
        // Ignored
      } finally {
        router.push("/login");
      }
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(logout, INACTIVITY_TIMEOUT);
    };

    let lastActivity = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity updates to once every 5 seconds to prevent browser lockup
      if (now - lastActivity > 5000) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Added mousemove back (it's throttled to 5s anyway) so reading/moving mouse counts as activity.
    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    // Use capture: true so we catch scroll events on nested elements (scroll doesn't bubble)
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true, capture: true }));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity, { capture: true }));
      clearTimeout(timeout);
    };
  }, [router]);

  return <>{children}</>;
}
