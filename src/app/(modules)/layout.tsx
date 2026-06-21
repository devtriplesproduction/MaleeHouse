"use client";

import React from "react";
import { UserProvider } from "@/providers/UserProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </UserProvider>
  );
}
