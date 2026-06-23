"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Timer, LogOut } from "lucide-react";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const COUNTDOWN_DURATION = 60; // 60 seconds warning

import { signOutAction } from "@/actions/auth.actions";

export function AutoLogout({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const router = useRouter();
  const supabase: any = createClient();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await signOutAction();
    } catch (err) {
      // Fallback if server action fails or throws redirect error
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    }
  }, [supabase, router]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setShowWarning(false);
    setCountdown(COUNTDOWN_DURATION);

    // Set new inactivity timeout
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - (COUNTDOWN_DURATION * 1000));
  }, [handleLogout]);

  useEffect(() => {
    // Events to monitor for activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    // Attach listeners
    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Initial start
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers, showWarning]);

  return (
    <>
      {children}
      <AlertDialog open={showWarning}>
        <AlertDialogContent className="glass-card border-rose-500/30 max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-bold">
              Session Expiring
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 pt-2">
              You've been inactive for a while. For your security, you will be logged out in:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-slate-100 dark:text-white/5"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - countdown / COUNTDOWN_DURATION)}
                  className="text-rose-500 transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center nums text-3xl font-black text-rose-500">
                {countdown}s
              </div>
            </div>
          </div>

          <AlertDialogFooter className="sm:justify-center gap-3">
            <AlertDialogAction
              onClick={resetTimers}
              className="btn-primary px-8"
            >
              I'm still here
            </AlertDialogAction>
            <button
              onClick={handleLogout}
              className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout Now
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
