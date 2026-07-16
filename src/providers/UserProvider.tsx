"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Role } from "@/lib/permissions/permissions";
import { useRouter } from "next/navigation";
import { signOutAction, getUserProfileAction } from "@/actions/auth.actions";

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
    try {
      const profile: any = await getUserProfileAction();

      if (!profile) {
        setUser(null);
        setRole(null);
      } else {
        setUser({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
        });
        setRole(profile.role as Role);
      }
    } catch (err) {
      console.error("Error in UserProvider fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    getUserProfile(true);

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setIsLoading(false);
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
