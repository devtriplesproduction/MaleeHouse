# Deployment & Environment Synchronization Guide

This document outlines the technical steps required to move the Malee House ERP from local development to a production environment.

## 1. Environment Variables Matrix

Ensure the following variables are set in your production environment (Vercel/Netlify/Docker):

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | API Endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API | Client-side data fetching |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API | Admin operations (Bypass RLS) |
| `NEXT_PUBLIC_SITE_URL` | Deployment | Auth redirect base URL |

## 2. Supabase Optimization

### Custom SMTP (Mandatory for Production)
The default Supabase email provider has a rate limit of 3 emails per hour. To avoid invite failures:
1.  Go to **Authentication -> Providers -> SMTP**.
2.  Enable SMTP and enter your provider details (SendGrid, Postmark, Resend, etc.).

### Storage Buckets
Ensure you have created the following public buckets in Supabase Storage:
-   `project-files`: For CAD drawings and site photos.
-   `avatars`: For user profile photos.

Policies for `project-files`:
-   **INSERT**: Authenticated users only.
-   **SELECT**: Project members and Admins.

## 3. Post-Deployment Verification Checklist

Once the system is live, the System Administrator should:

1.  **Run System Settings Migration**: (Refer to `artifacts/migration_system_settings.sql`).
2.  **Verify System Pulse**: Check the Admin Dashboard to ensure "System Status" is **Operational**.
3.  **Test Global Search**: Ensure `Cmd+K` correctly indexes existing test projects.
4.  **Confirm Mobile Responsiveness**: Open the dashboard on a smartphone to verify the vertical workflow stepper.

## 4. Maintenance & Backups
-   **Weekly Audit**: Review `activity_logs` via the Supabase dashboard.
-   **Configuration**: Adjust stage targets annually as the team's velocity improves.
-   **Backups**: Enable Supabase Point-in-Time Recovery (PITR) for enterprise-grade data protection.

---
**Technical Support:** support@maleehouse.com
