import React from 'react';
import { getSystemSettingsAction } from '@/actions/settings.actions';
import AdminSettingsClient from '@/components/modules/AdminSettingsClient';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminSettingsPage() {
  const supabase: any = await createClient();
  
  // Auth is handled by middleware for /admin routes
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Fetch Initial Settings
  const [targetsRes, profileRes, notifyRes] = await Promise.all([
    getSystemSettingsAction('stage_targets'),
    getSystemSettingsAction('org_profile'),
    getSystemSettingsAction('notification_settings')
  ]);

  const defaultTargets = {
    "lead_created": 2,
    "quotation_sent": 3,
    "payment_pending": 5,
    "payment_done": 2,
    "project_created": 1,
    "data_collection": 5,
    "prototype": 7,
    "review": 3,
    "field_work": 7,
    "completed": 1
  };

  const defaultProfile = {
    "company_name": "Malee House",
    "support_contact": "support@maleehouse.com",
    "primary_color": "#4f46e5"
  };



  const defaultNotify = {
    "email_on_new_project": true,
    "email_on_task_assigned": true,
    "email_on_qc_rejection": true,
    "email_on_payment_milestone": true
  };

  return (
    <AdminSettingsClient 
      initialTargets={targetsRes.success ? targetsRes.data : defaultTargets}
      initialProfile={profileRes.success ? profileRes.data : defaultProfile}
      initialNotify={notifyRes.success ? notifyRes.data : defaultNotify}
    />
  );
}
