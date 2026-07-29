"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth.actions";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function AutoLogout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_TIMEOUT / 1000);

  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    try {
      await signOutAction();
    } catch (err) {
      // Ignored
    } finally {
      router.push("/login");
    }
  }, [router]);

  // 1. Track user activity globally using a simple ref update
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove", "click"];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true, capture: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity, { capture: true }));
    };
  }, [showWarning]);

  // 2. Poll every 10 seconds to see if the inactivity threshold has been passed
  useEffect(() => {
    if (showWarning) return; // Stop polling if warning is already showing

    activityIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT) {
        setShowWarning(true);
        setTimeLeft(WARNING_TIMEOUT / 1000);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [showWarning]);

  // 3. Handle the warning countdown
  useEffect(() => {
    if (showWarning) {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    };
  }, [showWarning]);

  // Handle logout when countdown reaches zero
  useEffect(() => {
    if (showWarning && timeLeft <= 0) {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      logout();
    }
  }, [showWarning, timeLeft, logout]);

  const handleStayLoggedIn = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    logout();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Session Timeout Warning</h2>
            <p className="text-gray-600 mb-6">
              You have been inactive for a while. You will be logged out in <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>. Do you want to stay logged in?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleLogoutNow}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Log out now
              </button>
              <button 
                onClick={handleStayLoggedIn}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
