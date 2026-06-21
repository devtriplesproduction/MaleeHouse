# Security & RLS Audit Report: Malee House ERP

**Date:** 2026-05-10  
**Status:** ✅ HARDENED  
**Scope:** Supabase RLS Policies & Server Action RBAC

## 1. Data Isolation Strategy
The system utilizes a dual-layer security model:
1.  **Row Level Security (RLS)**: Enforced at the database level to ensure users can only access rows they are authorized to see.
2.  **Server Action RBAC**: Enforced in the application layer (`src/actions`) to prevent unauthorized triggers of sensitive business logic.

## 2. Table-Specific RLS Policies

### `profiles` (Table)
-   **SELECT**: Authenticated users can view all profiles (to enable @mentions and team management).
-   **UPDATE**: Users can only update their own profile (except for `role` and `is_active`, which are restricted to Admin).
-   **INSERT**: Restrict to `service_role` or triggered by Auth Hook.

### `projects` (Table)
-   **SELECT**: Authenticated users can view projects they are assigned to. Admins/Sales can view all.
-   **INSERT**: Restricted to `admin` and `sales` roles.
-   **UPDATE**: Restricted to `admin`, `sales`, and assigned `engineers`.
-   **DELETE**: Restricted to `admin` (Soft-delete only).

### `tasks` (Table)
-   **SELECT**: Assigned users and project members.
-   **UPDATE**: Assigned user (status only) and Admins (all fields).

### `system_settings` (Table)
-   **SELECT**: Public/Authenticated (read-only for app config).
-   **INSERT/UPDATE/DELETE**: STRICTLY `admin` role only.

## 3. Server Action Security Sweep
The following critical actions have been audited and hardened with mandatory role-checks:

| Action | Restricted Role | Security Measure |
| :--- | :--- | :--- |
| `inviteUserAction` | Admin | Mandatory Profile Role Check |
| `updateUserRoleAction` | Admin | Mandatory Profile Role Check |
| `adminWipeSystemAction` | Admin | Mandatory Profile Role Check + Keyphrase |
| `deleteProjectAction` | Admin | Soft-delete + Admin Role Check |
| `createProjectAction` | Admin, Sales | Zod Validation + Role Check |
| `submitProjectReviewAction` | QC, Admin | Role-based logic branching |

## 4. Mitigation of Multi-tenancy Risks
-   Every query targeting `projects` or `tasks` includes an explicit or implicit filter based on `project_id` or `assigned_to`.
-   The `profiles` table acts as the authoritative source for role verification, checked via `supabase.auth.getUser()` to prevent session spoofing.

---
**Audit Conclusion:** The platform is deemed secure for production deployment. All identified administrative gaps have been closed.
