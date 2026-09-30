import React from "react";
import { UserProvider } from "@/providers/UserProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getUserProfileAction } from "@/actions/auth.actions";
import { CompanySettingsProvider } from "@/providers/CompanySettingsProvider";
import { getCompanySettingsAction } from "@/actions/settings.actions";
import { NotificationProvider } from "@/providers/NotificationProvider";

/**
 * Slim layout bootstrap — only profile + settings on the server.
 * Notifications & birthdays load client-side once (saves ~3–5 DB hits per navigation).
 */
export default async function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, settings] = await Promise.all([
    getUserProfileAction(),
    getCompanySettingsAction(),
  ]);

  return (
    <UserProvider initialProfile={profile}>
      <CompanySettingsProvider initialSettings={settings}>
        <NotificationProvider initialNotifications={[]}>
          <DashboardLayout>{children}</DashboardLayout>
        </NotificationProvider>
      </CompanySettingsProvider>
    </UserProvider>
  );
}
