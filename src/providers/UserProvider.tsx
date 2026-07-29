"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

export function UserProvider({ children, initialProfile }: { children: React.ReactNode, initialProfile?: any }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (initialProfile) {
      return {
        id: initialProfile.id,
        name: `${initialProfile.first_name} ${initialProfile.last_name}`.trim(),
        email: initialProfile.email,
      };
    }
    return null;
  });
  const [role, setRole] = useState<Role | null>(() => initialProfile ? (initialProfile.role as Role) : null);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  // FIX: createClient() previously ran on every render, returning a new
  // client object each time. That object was a dependency of the useEffect
  // below, and the effect itself calls setUser/setRole/setIsLoading — so
  // every state update caused a re-render, which created a new supabase
  // reference, which re-ran the effect, which called getUserProfileAction()
  // (a Server Action) again, causing a self-perpetuating loop of duplicate
  // profile fetches. useState(() => ...) creates the client exactly once.
  const [supabase] = useState<any>(() => createClient());
  const router = useRouter();

  // FIX: wrap in useCallback so this function has a stable identity across
  // renders instead of being redefined (and therefore unusable as a safe
  // effect dependency) every render.
  //
  // FIX: structural in-flight guard. getUserProfile can be triggered from
  // two places close together in real usage — the mount effect and an
  // onAuthStateChange event (e.g. SIGNED_IN firing right after mount) — and
  // previously each trigger started its own independent
  // getUserProfileAction() call. This ref holds the in-flight promise so a
  // second caller awaits the same request instead of issuing a duplicate
  // Server Action call.
  const inFlightRequest = useRef<Promise<void> | null>(null);

  const getUserProfile = useCallback(async (forceLoading = false) => {
    if (inFlightRequest.current) {
      return inFlightRequest.current;
    }

    const run = async () => {
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

    const promise = run().finally(() => {
      inFlightRequest.current = null;
    });
    inFlightRequest.current = promise;
    return promise;
  }, []);

  // Initial fetch effect
  useEffect(() => {
    upLog('INITIAL_MOUNT', { hasInitialProfile: !!initialProfile });
    if (initialProfile) return;
    getUserProfile(true);
  }, [initialProfile, getUserProfile]);

  const isInitialAuthEvent = useRef(true);

  // Auth subscription effect
  useEffect(() => {
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

      const wasInitial = isInitialAuthEvent.current;
      isInitialAuthEvent.current = false;

      if (event === 'SIGNED_OUT') {
        upLog('REDIRECT_TO_LOGIN', { reason: 'SIGNED_OUT event' })
        setUser(null);
        setRole(null);
        // Do not set isLoading(false) to avoid re-rendering protected components with a null user during redirect.
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Skip fetching if this is the initial mount event and the server already provided the profile for this user
        if (wasInitial && initialProfile && initialProfile.id === session?.user?.id) {
          upLog('SKIP_GET_PROFILE', { reason: 'Initial event and profile matches' });
          return;
        }
        getUserProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, getUserProfile, initialProfile]);

  const signOut = useCallback(async () => {
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
  }, [supabase]);

  const refreshUser = useCallback(() => getUserProfile(), [getUserProfile]);

  // FIX: memoize the context value. Previously a new object literal was
  // passed to the provider on every render, forcing every consumer of
  // useUserContext()/useUser() to re-render even when nothing they cared
  // about had changed.
  const contextValue = useMemo(
    () => ({ user, role, isLoading, signOut, refreshUser }),
    [user, role, isLoading, signOut, refreshUser]
  );

  return (
    <UserContext.Provider value={contextValue}>
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
