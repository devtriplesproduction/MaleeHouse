"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Role } from "@/lib/permissions/permissions";
import { useRouter } from "next/navigation";
import { signOutAction, getUserProfileAction } from "@/actions/auth.actions";

// [DIAG] Remove when bug is resolved.
const DEV = process.env.NODE_ENV === 'development'
function upLog(tag: string, data?: Record<string, unknown>) {
  if (!DEV) return
  console.log(`[UP ${new Date().toISOString()}] ${tag}`, data ? JSON.stringify(data) : '')
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: UserProfile | null;
  role: Role | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase: any = createClient();
  const router = useRouter();

  const getUserProfile = async (forceLoading = false) => {
    if (forceLoading) setIsLoading(true);
    // [DIAG]
    upLog('GET_PROFILE_START', { forceLoading })
    try {
      const profile: any = await getUserProfileAction();

      if (!profile) {
        // [DIAG]
        upLog('GET_PROFILE_NULL', {})
        setUser(null);
        setRole(null);
      } else {
        // [DIAG]
        upLog('GET_PROFILE_OK', { id: profile.id, role: profile.role, is_active: profile.is_active })
        setUser({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
        });
        setRole(profile.role as Role);
      }
    } catch (err) {
      // [DIAG]
      upLog('GET_PROFILE_ERROR', { error: String(err) })
      console.error("Error in UserProvider fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    upLog('INITIAL_MOUNT', {})
    getUserProfile(true);

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      // [DIAG]
      const expiresAt = session?.expires_at
      const expiresIn = expiresAt ? Math.round(expiresAt - Date.now() / 1000) : null
      upLog('AUTH_EVENT', {
        event,
        uid: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        expiresInSeconds: expiresIn,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
      })

      if (event === 'SIGNED_OUT') {
        upLog('REDIRECT_TO_LOGIN', { reason: 'SIGNED_OUT event' })
        setUser(null);
        setRole(null);
        // Do not set isLoading(false) to avoid re-rendering protected components with a null user during redirect.
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getUserProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await signOutAction();
    } catch (err: any) {
      console.error("Sign out error:", err);
    } finally {
      sessionStorage.removeItem("hasSeenBirthdays_v7");
      supabase.auth.signOut().catch(console.error);
      // Let the onAuthStateChange listener handle the UI teardown and redirect
    }
  };

  return (
    <UserContext.Provider value={{ user, role, isLoading, signOut, refreshUser: () => getUserProfile() }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
