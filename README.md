# Malee House ERP: Operational Manual & Deployment Guide

Welcome to the **Malee House Enterprise Resource Planning (ERP)** platform—a premium, high-fidelity command center designed to orchestrate survey workflows from lead generation to final QC approval.

## 🚀 Deployment Guide (Vercel + Supabase)

### 1. Database Setup (Supabase)
1.  **Create Project**: Initialize a new project on [Supabase](https://supabase.com).
2.  **Schema Migration**: 
    -   Navigate to the **SQL Editor**.
    -   Run the foundational schema script (located in `Docs/Schema.sql` if provided, or use the generated `database.types.ts` as reference).
    -   **CRITICAL**: Run the `system_settings` migration provided in the handover artifact to enable dynamic operational targets.
3.  **Authentication**:
    -   Enable **Email/Password** provider in Auth Settings.
    -   Disable "Confirm Email" for development, or configure a custom SMTP for production.

### 2. Frontend Deployment (Vercel)
1.  **Push to GitHub**: Connect your repository to Vercel.
2.  **Environment Variables**: Configure the following keys in Vercel:
    -   `NEXT_PUBLIC_SUPABASE_URL`: Your project URL.
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key.
    -   `SUPABASE_SERVICE_ROLE_KEY`: Required for administrative server actions (Invite/Wipe).
    -   `NEXT_PUBLIC_SITE_URL`: The production URL (e.g., `https://maleehouse.vercel.app`).
3.  **Build Command**: `npm run build`.

---

## 🛠 Operational Manual (User Roles)

The platform supports 7 distinct roles, each with a tailored workflow:

### 1. System Administrator
-   **Responsibility**: Platform health, user management, and system-wide settings.
-   **Key Actions**:
    -   **User Control**: Invite new team members and assign roles.
    -   **Global Config**: Adjust "Target Days" for project stages to fine-tune efficiency analytics.
    -   **Production Wipe**: Use the "Prepare for Production" utility to purge test data before going live.

### 2. Sales Representative
-   **Responsibility**: Lead generation and client onboarding.
-   **Key Actions**:
    -   **Project Initiation**: Create new leads and input site metadata.
    -   **Quotation Tracking**: Monitor the "Sales Pipeline" and move projects to the payment stage.

### 3. Accountant
-   **Responsibility**: Financial verification and project archival.
-   **Key Actions**:
    -   **Payment Approval**: Verify client payments to unlock technical workflows.
    -   **Archiving**: Close completed projects with a satisfaction score and archival note.

### 4. Field Engineer
-   **Responsibility**: On-site data collection.
-   **Key Actions**:
    -   **Mobile Workflow**: Use the mobile-optimized stepper to log field progress.
    -   **Asset Upload**: Upload site photos and raw survey data directly from the field.

### 5. CAD Technician
-   **Responsibility**: Drafting and technical documentation.
-   **Key Actions**:
    -   **Drawing Management**: Submit CAD drafts for review.
    -   **Version Control**: Track comments and revision requests from QC.

### 6. Design Engineer
-   **Responsibility**: Technical oversight and prototype development.
-   **Key Actions**:
    -   **Project Lead**: Coordinate between CAD and Field teams.
    -   **Workflow Progression**: Advance projects through the technical design stages.

### 7. QC (Quality Control)
-   **Responsibility**: Final approval and quality assurance.
-   **Key Actions**:
    -   **Decision Gate**: Approve or Reject technical submissions.
    -   **Automatic Correction**: Rejecting a stage automatically generates a high-priority "Correction Required" task for the engineer.

---

## 🔒 Security Policy
-   **Data Isolation**: Project data is strictly isolated via RLS.
-   **Audit Logs**: Every stage transition and comment is logged with a timestamp and actor ID.
-   **Auto-Logout**: Inactivity monitor automatically secures sessions after 5 minutes of idle time.

---
© 2026 Malee House Software | Built with Next.js, Supabase, and Framer Motion.
