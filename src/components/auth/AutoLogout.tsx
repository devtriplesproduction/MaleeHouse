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

    // Minimal events (removed mousemove to reduce spam, mousedown/keydown is enough)
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(timeout);
    };
  }, [router]);

  return <>{children}</>;
}
