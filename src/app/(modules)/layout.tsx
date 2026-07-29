import React from "react";
import { UserProvider } from "@/providers/UserProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getUserProfileAction } from "@/actions/auth.actions";
import { CompanySettingsProvider } from "@/providers/CompanySettingsProvider";
import { getCompanySettingsAction } from "@/actions/settings.actions";
import { getNotificationsAction } from "@/actions/notification.actions";
import { getTodayBirthdaysAction } from "@/actions/auth.actions";
import { NotificationProvider } from "@/providers/NotificationProvider";

export default async function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfileAction();
  const settings = await getCompanySettingsAction();
  
  const [notificationsRes, birthdaysRes] = await Promise.all([
    getNotificationsAction(),
    getTodayBirthdaysAction()
  ]);

  const initialNotifications = notificationsRes.success && notificationsRes.data ? notificationsRes.data.filter((n: any) => !n.related_project_id) : [];
  const initialBirthdays = birthdaysRes.success && birthdaysRes.data ? birthdaysRes.data : [];

  return (
    <UserProvider initialProfile={profile}>
      <CompanySettingsProvider initialSettings={settings}>
        <NotificationProvider initialNotifications={initialNotifications}>
          <DashboardLayout initialBirthdays={initialBirthdays}>{children}</DashboardLayout>
        </NotificationProvider>
      </CompanySettingsProvider>
    </UserProvider>
  );
}
