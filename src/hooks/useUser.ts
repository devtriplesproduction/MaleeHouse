"use client";

import { useUserContext, UserProfile } from "@/providers/UserProvider";

export type { UserProfile };

export const useUser = () => {
  const context = useUserContext();
  return {
    user: context.user,
    role: context.role,
    isLoading: context.isLoading,
    signOut: context.signOut,
    refreshUser: context.refreshUser,
  };
};

