


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."audit_severity" AS ENUM (
    'info',
    'warning',
    'critical',
    'security'
);


ALTER TYPE "public"."audit_severity" OWNER TO "postgres";


CREATE TYPE "public"."cad_revision_status" AS ENUM (
    'pending_review',
    'approved',
    'rejected',
    'rework_requested'
);


ALTER TYPE "public"."cad_revision_status" OWNER TO "postgres";


CREATE TYPE "public"."employee_status" AS ENUM (
    'active',
    'probation',
    'onboarding_pending',
    'invited',
    'suspended',
    'resigned',
    'terminated'
);


ALTER TYPE "public"."employee_status" OWNER TO "postgres";


CREATE TYPE "public"."field_report_status" AS ENUM (
    'submitted',
    'acknowledged',
    'resolved'
);


ALTER TYPE "public"."field_report_status" OWNER TO "postgres";


CREATE TYPE "public"."field_report_type" AS ENUM (
    'progress',
    'completion',
    'issue'
);


ALTER TYPE "public"."field_report_type" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."leave_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_type" AS ENUM (
    'sick',
    'casual',
    'earned',
    'unpaid',
    'maternity',
    'paternity',
    'other'
);


ALTER TYPE "public"."leave_type" OWNER TO "postgres";


CREATE TYPE "public"."milestone_status" AS ENUM (
    'pending',
    'invoiced',
    'paid'
);


ALTER TYPE "public"."milestone_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'assignment',
    'stage_update',
    'approval',
    'rejection',
    'deadline_warning',
    'system',
    'payroll'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."project_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."project_priority" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'lead',
    'requirement_gathering',
    'quotation_requested',
    'quotation_sent',
    'payment_pending',
    'payment_done',
    'project_created',
    'data_collection',
    'prototype',
    'review',
    'field_assigned',
    'field_work',
    'data_sync',
    'final_review',
    'completed',
    'archived'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."quotation_status" AS ENUM (
    'Draft',
    'Pending',
    'Sent',
    'Viewed',
    'Approved',
    'Rejected',
    'Revision Requested',
    'Expired'
);


ALTER TYPE "public"."quotation_status" OWNER TO "postgres";


CREATE TYPE "public"."site_type" AS ENUM (
    'residential',
    'commercial',
    'industrial',
    'infrastructure',
    'agricultural',
    'other'
);


ALTER TYPE "public"."site_type" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'submitted',
    'completed',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'sales',
    'accountant',
    'engineer',
    'cad',
    'field',
    'field_engineer',
    'qc',
    'employee',
    'hr'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."visit_status" AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'paid'
);


ALTER TYPE "public"."visit_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_backdated_reconciliations"("p_bank_id" "uuid", "p_transaction_date" "date", "p_trigger_type" "text", "p_triggered_by" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Flag only CURRENT active snapshots that are stale because of the backdated transaction
  UPDATE bank_reconciliations
  SET review_status = 'needs_review',
      review_trigger_type = p_trigger_type,
      review_trigger_date = p_transaction_date,
      review_triggered_by = p_triggered_by,
      review_triggered_at = NOW()
  WHERE bank_id = p_bank_id
    AND statement_date >= p_transaction_date
    AND review_status <> 'needs_review'
    AND status IS NOT NULL
    AND is_current = true;

  -- If any reconciliations were flagged, update the bank account summary cache
  IF FOUND THEN
    UPDATE bank_accounts
    SET reconciliation_review_status = 'needs_review'
    WHERE id = p_bank_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."flag_backdated_reconciliations"("p_bank_id" "uuid", "p_transaction_date" "date", "p_trigger_type" "text", "p_triggered_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_system_notification"("p_target_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_related_project_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_id UUID := auth.uid();
BEGIN
  -- Get caller role
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  
  -- Rule 1: Admins, Accountants, HR, and Sales can always generate notifications
  IF v_caller_role IN ('admin', 'accountant', 'hr', 'sales') THEN
     -- Allow insert
     NULL;
  
  -- Rule 2: Operations can only generate notifications if they are assigned to the project
  ELSIF v_caller_role IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') AND p_related_project_id IS NOT NULL THEN
     IF NOT is_project_participant(p_related_project_id) THEN
        RAISE EXCEPTION 'Unauthorized: Not a participant of this project';
     END IF;
  
  -- Rule 3: Allow users to create self-assigned notifications or generic non-project system alerts 
  -- (e.g. EOD reminders, though those usually come from cron)
  ELSIF p_target_user_id = v_caller_id THEN
     -- Allow self-insert
     NULL;
     
  ELSE
     RAISE EXCEPTION 'Unauthorized: Caller lacks permissions to generate this notification';
  END IF;

  -- Insert the notification
  INSERT INTO notifications (id, user_id, title, message, type, is_read, related_project_id, created_at)
  VALUES (
    'ntf-' || (extract(epoch from now()) * 1000)::bigint::text || '-' || substr(md5(random()::text), 1, 4),
    p_target_user_id,
    p_title,
    p_message,
    p_type,
    false,
    p_related_project_id,
    now()
  );
END;
$$;


ALTER FUNCTION "public"."generate_system_notification"("p_target_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_related_project_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_project_ids"() RETURNS SETOF "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT project_id FROM public.project_assignments WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_project_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_project_id"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_yymm TEXT;
  last_id TEXT;
  next_num INTEGER;
  new_id TEXT;
BEGIN
  -- Get current year/month in YYMM format
  current_yymm := to_char(CURRENT_DATE, 'YYMM');
  
  -- Find the highest ID for the current month
  SELECT id INTO last_id
  FROM projects
  WHERE id LIKE 'PRJ-' || current_yymm || '-%'
  ORDER BY id DESC
  LIMIT 1;
  
  IF last_id IS NULL THEN
    -- First project of the month
    new_id := 'PRJ-' || current_yymm || '-001';
  ELSE
    -- Extract the numeric part and increment
    next_num := CAST(SUBSTRING(last_id FROM 10 FOR 3) AS INTEGER) + 1;
    new_id := 'PRJ-' || current_yymm || '-' || LPAD(next_num::TEXT, 3, '0');
  END IF;
  
  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."get_next_project_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "public"."user_role"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN current_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profile_auth_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role', NEW.role,
      'is_active', NEW.is_active
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_profile_auth_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_engineer"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'engineer'
  );
END;
$$;


ALTER FUNCTION "public"."is_engineer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_participant"("p_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_assigned BOOLEAN;
  u_role TEXT;
BEGIN
  -- 1. Check direct assignment
  SELECT EXISTS (
    SELECT 1 FROM project_assignments
    WHERE project_id = p_id AND user_id = auth.uid()
  ) INTO is_assigned;
  
  IF is_assigned THEN
    RETURN TRUE;
  END IF;

  -- 2. If not directly assigned, allow access based on role
  u_role := get_user_role();
  
  -- Admins, sales, and accountants have broad access anyway
  IF u_role IN ('admin', 'sales', 'accountant') THEN
    RETURN TRUE;
  END IF;

  -- Operations team needs to see projects in the pipeline to accept assignments
  -- and collaborate. 
  IF u_role IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_project_participant"("p_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_lock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    app RECORD;
    v_new_remaining NUMERIC;
    v_new_status TEXT;
BEGIN
    -- 1. Lock the cycle
    UPDATE public.payroll_cycles 
    SET status = 'locked', locked_by = p_user_id, locked_at = now()
    WHERE id = p_cycle_id;

    -- 2. Fetch all draft applications for this cycle
    FOR app IN 
        SELECT pa.id, pa.ledger_id, pa.applied_amount, efl.remaining_amount, efl.adjustment_category 
        FROM public.payroll_adjustment_applications pa
        JOIN public.employee_financial_ledger efl ON pa.ledger_id = efl.id
        WHERE pa.cycle_id = p_cycle_id AND pa.status = 'draft'
    LOOP
        -- 3. Mark application as applied
        UPDATE public.payroll_adjustment_applications 
        SET status = 'applied', applied_by = p_user_id, applied_at = now()
        WHERE id = app.id;

        -- 4. If recoverable, burndown remaining balance
        IF app.adjustment_category = 'recoverable' THEN
            v_new_remaining := app.remaining_amount - app.applied_amount;
            IF v_new_remaining < 0 THEN v_new_remaining := 0; END IF;
            
            IF v_new_remaining = 0 THEN
                v_new_status := 'completed';
            ELSE
                v_new_status := 'partially_recovered';
            END IF;

            UPDATE public.employee_financial_ledger
            SET remaining_amount = v_new_remaining, status = v_new_status
            WHERE id = app.ledger_id;
        ELSE
            -- For one_time items, just mark as completed since they are fully applied in one go
            UPDATE public.employee_financial_ledger
            SET status = 'completed'
            WHERE id = app.ledger_id;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."rpc_lock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_unlock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    app RECORD;
    v_new_remaining NUMERIC;
    v_new_status TEXT;
BEGIN
    -- 1. Revert cycle to draft_saved (or draft)
    -- We revert to draft_saved so HR can edit the drafts.
    UPDATE public.payroll_cycles 
    SET status = 'draft_saved', locked_by = NULL, locked_at = NULL
    WHERE id = p_cycle_id;

    -- 2. Process applied applications
    FOR app IN 
        SELECT pa.id, pa.ledger_id, pa.applied_amount, efl.remaining_amount, efl.original_amount, efl.adjustment_category 
        FROM public.payroll_adjustment_applications pa
        JOIN public.employee_financial_ledger efl ON pa.ledger_id = efl.id
        WHERE pa.cycle_id = p_cycle_id AND pa.status = 'applied'
    LOOP
        -- 3. Revert application to draft
        UPDATE public.payroll_adjustment_applications 
        SET status = 'draft', applied_by = NULL, applied_at = NULL
        WHERE id = app.id;

        -- 4. If recoverable, restore balance
        IF app.adjustment_category = 'recoverable' THEN
            v_new_remaining := app.remaining_amount + app.applied_amount;
            
            IF v_new_remaining >= app.original_amount THEN
                v_new_status := 'pending';
            ELSE
                v_new_status := 'partially_recovered';
            END IF;

            UPDATE public.employee_financial_ledger
            SET remaining_amount = v_new_remaining, status = v_new_status
            WHERE id = app.ledger_id;
        ELSE
            -- For one_time items, revert to pending
            UPDATE public.employee_financial_ledger
            SET status = 'pending'
            WHERE id = app.ledger_id;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."rpc_unlock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_reconciliation"("p_bank_id" "uuid", "p_statement_date" "date", "p_statement_balance" numeric, "p_notes" "text", "p_status" "text", "p_adjustment_amount" numeric, "p_adjustment_reason" "text", "p_reconciled_by" "uuid", "p_opening_balance" numeric, "p_erp_balance" numeric, "p_transaction_count" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role TEXT;
  v_existing_id UUID;
  v_existing_review_status TEXT;
BEGIN
  -- Check caller authorization
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'accountant') THEN
    RAISE EXCEPTION 'Access denied. Only Admins and Accountants can save reconciliations.';
  END IF;

  -- Find the current active reconciliation for this date
  SELECT id, review_status INTO v_existing_id, v_existing_review_status
  FROM bank_reconciliations
  WHERE bank_id = p_bank_id AND statement_date = p_statement_date AND is_current = true;

  IF v_existing_id IS NOT NULL THEN
    -- If it exists, we can ONLY supersede it if it is currently marked 'needs_review'
    IF v_existing_review_status != 'needs_review' THEN
      RAISE EXCEPTION 'This period is already reconciled and locked. You can only re-reconcile periods marked as Needs Review.';
    END IF;
    
    -- Mark the existing one as superseded (is_current = false), tracking when and who did it.
    UPDATE bank_reconciliations
    SET is_current = false,
        superseded_at = NOW(),
        superseded_by = auth.uid()
    WHERE id = v_existing_id;
  END IF;

  -- Insert the new active reconciliation snapshot
  BEGIN
    INSERT INTO bank_reconciliations (
      bank_id, statement_date, opening_balance, erp_balance, statement_balance, 
      difference, transaction_count, status, adjustment_amount, adjustment_reason, 
      reconciled_by, notes, review_status, is_current
    ) VALUES (
      p_bank_id, p_statement_date, p_opening_balance, p_erp_balance, p_statement_balance,
      p_erp_balance - p_statement_balance, p_transaction_count, p_status, p_adjustment_amount, p_adjustment_reason,
      p_reconciled_by, p_notes, 'normal', true
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'A current reconciliation is already active for this period. Please refresh and try again.';
  END;

  -- Update cached statistics on bank_accounts
  UPDATE bank_accounts
  SET last_reconciled_at = NOW(),
      last_reconciled_balance = p_statement_balance,
      reconciliation_status = p_status
  WHERE id = p_bank_id;

  -- Reset bank reconciliation_review_status back to normal if no CURRENT snapshots are left in needs_review
  IF NOT EXISTS (
    SELECT 1 FROM bank_reconciliations 
    WHERE bank_id = p_bank_id AND review_status = 'needs_review' AND is_current = true
  ) THEN
    UPDATE bank_accounts
    SET reconciliation_review_status = 'normal'
    WHERE id = p_bank_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."save_reconciliation"("p_bank_id" "uuid", "p_statement_date" "date", "p_statement_balance" numeric, "p_notes" "text", "p_status" "text", "p_adjustment_amount" numeric, "p_adjustment_reason" "text", "p_reconciled_by" "uuid", "p_opening_balance" numeric, "p_erp_balance" numeric, "p_transaction_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_to_auth_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- We only want to run this if the role actually changed or is newly inserted
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role)
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_to_auth_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employee_financial_ledger_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_employee_financial_ledger_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payroll_adjustment_apps_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payroll_adjustment_apps_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_salary_slips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_salary_slips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "text" NOT NULL,
    "project_id" "text",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "severity" "public"."audit_severity" DEFAULT 'info'::"public"."audit_severity",
    "target_user_id" "uuid",
    "actor_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."activity_logs" IS 'Append-only audit trail for all system actions.';



COMMENT ON COLUMN "public"."activity_logs"."details" IS 'JSON payload containing action-specific context.';



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "posted_by" "uuid",
    "target_roles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "date" "date" NOT NULL,
    "status" "text" DEFAULT 'present'::"text",
    "check_in" timestamp with time zone,
    "check_out" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid",
    "date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "signal_type" "text" NOT NULL,
    "finalized" boolean DEFAULT false,
    "notes" "text",
    "locked_payroll_cycle_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "ifsc_code" "text" NOT NULL,
    "branch_name" "text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "account_usage" "text" DEFAULT 'operations'::"text" NOT NULL,
    "opening_balance" numeric(14,2) DEFAULT 0.00 NOT NULL,
    "current_balance" numeric(14,2) DEFAULT 0.00 NOT NULL,
    "last_reconciled_at" timestamp with time zone,
    "last_reconciled_balance" numeric(14,2),
    "reconciliation_status" "text" DEFAULT 'unreconciled'::"text",
    "reconciliation_review_status" "text" DEFAULT 'normal'::"text",
    CONSTRAINT "bank_accounts_reconciliation_review_status_check" CHECK (("reconciliation_review_status" = ANY (ARRAY['normal'::"text", 'needs_review'::"text"]))),
    CONSTRAINT "bank_accounts_reconciliation_status_check" CHECK (("reconciliation_status" = ANY (ARRAY['matched'::"text", 'discrepancy'::"text", 'adjusted'::"text", 'unreconciled'::"text"])))
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_reconciliations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_id" "uuid" NOT NULL,
    "statement_date" "date" NOT NULL,
    "opening_balance" numeric(14,2) NOT NULL,
    "erp_balance" numeric(14,2) NOT NULL,
    "statement_balance" numeric(14,2) NOT NULL,
    "difference" numeric(14,2) NOT NULL,
    "transaction_count" integer DEFAULT 0 NOT NULL,
    "status" "text" NOT NULL,
    "adjustment_amount" numeric(14,2) DEFAULT 0,
    "reconciled_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "adjustment_reason" "text",
    "is_current" boolean DEFAULT true,
    "review_status" "text" DEFAULT 'normal'::"text",
    "review_trigger_type" "text",
    "review_trigger_date" "date",
    "review_triggered_by" "uuid",
    "review_triggered_at" timestamp with time zone,
    "superseded_at" timestamp with time zone,
    "superseded_by" "uuid",
    CONSTRAINT "bank_reconciliations_review_status_check" CHECK (("review_status" = ANY (ARRAY['normal'::"text", 'needs_review'::"text"]))),
    CONSTRAINT "bank_reconciliations_status_check" CHECK (("status" = ANY (ARRAY['matched'::"text", 'discrepancy'::"text", 'adjusted'::"text"])))
);


ALTER TABLE "public"."bank_reconciliations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cad_revisions" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "revision_number" integer DEFAULT 1 NOT NULL,
    "title" "text",
    "description" "text" DEFAULT ''::"text",
    "files" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "public"."cad_revision_status" DEFAULT 'pending_review'::"public"."cad_revision_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "revision_type" "text" DEFAULT 'prototype'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cad_revisions" OWNER TO "postgres";


COMMENT ON TABLE "public"."cad_revisions" IS 'CAD prototype and final drawing submissions with engineer review workflow.';



COMMENT ON COLUMN "public"."cad_revisions"."status" IS 'pending_review | approved | rejected | rework_requested';



COMMENT ON COLUMN "public"."cad_revisions"."revision_type" IS 'prototype = initial CAD; final = deliverable for QC.';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "mentions" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "comment_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "parent_comment_id" "text"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'Project comments and discussion threads.';



CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "text" NOT NULL,
    "name" "text",
    "address" "text",
    "cityStateZip" "text",
    "gstin" "text",
    "telephone" "text",
    "mobile" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bankName" "text",
    "accountName" "text",
    "accountNumber" "text",
    "ifscCode" "text",
    "branchName" "text",
    "upiId" "text"
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_checklist" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "qc_approved" boolean DEFAULT false NOT NULL,
    "deliverables_uploaded" boolean DEFAULT false NOT NULL,
    "client_acknowledged" boolean DEFAULT false NOT NULL,
    "final_payment_cleared" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delivery_checklist" OWNER TO "postgres";


COMMENT ON TABLE "public"."delivery_checklist" IS 'Project completion gate checklist. 1:1 with projects.';



CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid",
    "category" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_financial_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "adjustment_type" "text" NOT NULL,
    "adjustment_category" "text" NOT NULL,
    "original_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "remaining_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "suggested_installment_amount" numeric(12,2),
    "effective_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_financial_ledger_adjustment_category_check" CHECK (("adjustment_category" = ANY (ARRAY['recoverable'::"text", 'one_time'::"text"]))),
    CONSTRAINT "employee_financial_ledger_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partially_recovered'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."employee_financial_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."eod_reports" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "tasks_completed" "text" NOT NULL,
    "blockers" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hours_spent" numeric DEFAULT 8.5,
    "status" "text" DEFAULT 'pending'::"text",
    "adjusted_hours" numeric,
    "admin_note" "text"
);


ALTER TABLE "public"."eod_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."eod_reports" IS 'End of day reports submitted by employees.';



CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "text",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "expense_date" "date" NOT NULL,
    "created_by" "uuid",
    "receipt_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bank_id" "uuid",
    CONSTRAINT "expenses_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


COMMENT ON TABLE "public"."expenses" IS 'Expense tracking records for projects or general operations.';



CREATE TABLE IF NOT EXISTS "public"."field_reports" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "report_type" "public"."field_report_type" DEFAULT 'progress'::"public"."field_report_type" NOT NULL,
    "report_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "content" "text" NOT NULL,
    "issues_identified" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "public"."field_report_status" DEFAULT 'submitted'::"public"."field_report_status" NOT NULL,
    "acknowledged_by" "uuid",
    "acknowledged_at" timestamp with time zone,
    "location_lat" numeric(10,7),
    "location_lng" numeric(10,7),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."field_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."field_reports" IS 'Daily field survey reports submitted by surveyors.';



COMMENT ON COLUMN "public"."field_reports"."report_type" IS 'progress | completion | issue';



COMMENT ON COLUMN "public"."field_reports"."status" IS 'submitted | acknowledged | resolved';



CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "category" "text" NOT NULL,
    "file_size_bytes" bigint,
    "mime_type" "text",
    "uploaded_by" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."files" OWNER TO "postgres";


COMMENT ON TABLE "public"."files" IS 'File vault for projects. Points to Supabase Storage URLs.';



COMMENT ON COLUMN "public"."files"."category" IS 'Used for RBAC and UI organization (e.g., survey_data vs deliverables).';



CREATE TABLE IF NOT EXISTS "public"."fund_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "text" NOT NULL,
    "bank_account_id" "uuid",
    "service_divide" "text" NOT NULL,
    "day" numeric DEFAULT 1,
    "amount" numeric DEFAULT 0,
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fund_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."holidays" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "is_optional" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."holidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "gst_rate" numeric(5,2) DEFAULT 18 NOT NULL,
    "gst_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(14,2) NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'sent'::"public"."invoice_status" NOT NULL,
    "milestone_id" "text",
    "visit_id" "text",
    "due_date" "date",
    "notes" "text" DEFAULT ''::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bank_id" "uuid"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Project invoices. Linked to milestones or field visits for billing automation.';



COMMENT ON COLUMN "public"."invoices"."milestone_id" IS 'FK to project_milestones.id — added by ALTER after milestone table exists.';



COMMENT ON COLUMN "public"."invoices"."visit_id" IS 'FK to project_visits.id — added by ALTER after visits table exists.';



CREATE TABLE IF NOT EXISTS "public"."issues" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'open'::"text",
    "reported_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."issues" OWNER TO "postgres";


COMMENT ON TABLE "public"."issues" IS 'Issue tracking for projects (e.g. blockers, client disputes).';



CREATE TABLE IF NOT EXISTS "public"."leaves" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "leave_type" "public"."leave_type" DEFAULT 'casual'::"public"."leave_type" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "public"."leave_status" DEFAULT 'pending'::"public"."leave_status" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leaves" OWNER TO "postgres";


COMMENT ON TABLE "public"."leaves" IS 'Employee leave requests.';



CREATE TABLE IF NOT EXISTS "public"."material_requests" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "quantity" numeric NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "material_requests_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'approved'::"text", 'delivered'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."material_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'system'::"public"."notification_type" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "related_project_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'In-app notifications for users.';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "invoice_id" "text",
    "amount" numeric(14,2) NOT NULL,
    "payment_method" "text" DEFAULT 'bank_transfer'::"text" NOT NULL,
    "transaction_id" "text",
    "receipt_url" "text",
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bank_id" "uuid"
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."payments" IS 'Payment records. Duplicate prevention via unique transaction_id and receipt_url.';



COMMENT ON COLUMN "public"."payments"."transaction_id" IS 'Bank/UPI reference number. Unique constraint prevents duplicate logging.';



COMMENT ON COLUMN "public"."payments"."verified_by" IS 'Accountant/Admin who verified or rejected the payment.';



CREATE TABLE IF NOT EXISTS "public"."payroll" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "month" "text" NOT NULL,
    "base_salary" numeric NOT NULL,
    "bonuses" numeric DEFAULT 0,
    "deductions" numeric DEFAULT 0,
    "net_salary" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_adjustment_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "applied_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "applied_at" timestamp with time zone,
    "applied_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_adjustment_applications_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'applied'::"text"])))
);


ALTER TABLE "public"."payroll_adjustment_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "batch_number" "text",
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "previous_state" "jsonb",
    "new_state" "jsonb",
    "notes" "text",
    "action_source" "text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_cycles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "locked_by" "uuid",
    "locked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bank_id" "uuid",
    "batch_number" "text",
    "slip_status" "text" DEFAULT 'none'::"text",
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "total_employees" integer,
    "gross_payroll" numeric(14,2),
    "total_additions" numeric(14,2),
    "total_deductions" numeric(14,2),
    "total_absent_deduction" numeric(14,2),
    "net_payroll" numeric(14,2),
    "checklist_attendance" boolean DEFAULT false,
    "checklist_advances" boolean DEFAULT false,
    "checklist_bonuses" boolean DEFAULT false,
    "checklist_deductions" boolean DEFAULT false,
    "checklist_net_payroll" boolean DEFAULT false,
    "checklist_verified_by" "uuid",
    "checklist_verified_at" timestamp with time zone,
    "draft_created_at" timestamp with time zone DEFAULT "now"(),
    "draft_created_by" "uuid",
    "last_draft_saved_by" "uuid",
    "submitted_to_accounts_by" "uuid",
    "submitted_at" timestamp with time zone,
    "slips_generated_at" timestamp with time zone,
    "slips_released_at" timestamp with time zone,
    "paid_at" timestamp with time zone
);


ALTER TABLE "public"."payroll_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payroll_cycle_id" "uuid" NOT NULL,
    "bank_id" "uuid",
    "payment_date" "date" NOT NULL,
    "payment_method" "text" NOT NULL,
    "payment_reference" "text",
    "payment_currency" "text" DEFAULT 'INR'::"text",
    "payment_total_amount" numeric(14,2) NOT NULL,
    "payment_notes" "text",
    "paid_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_slip_runs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payroll_cycle_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'generated'::"text" NOT NULL,
    "employee_count" integer DEFAULT 0 NOT NULL,
    "generated_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "generated_by" "uuid",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "released_by" "uuid",
    "released_at" timestamp with time zone
);


ALTER TABLE "public"."payroll_slip_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cycle_id" "uuid",
    "employee_id" "uuid",
    "employee_name" "text",
    "employee_id_external" "text",
    "department" "text",
    "designation" "text",
    "base_salary" numeric,
    "days_present" integer,
    "days_field" integer,
    "days_paid_leave" integer,
    "days_unpaid_leave" integer,
    "days_absent" integer,
    "net_payable" numeric,
    "calculated_at" timestamp with time zone DEFAULT "now"(),
    "basic_salary" numeric(12,2) DEFAULT 0,
    "hra" numeric(12,2) DEFAULT 0,
    "allowance" numeric(12,2) DEFAULT 0,
    "bonus" numeric(12,2) DEFAULT 0,
    "gross_salary" numeric(12,2) DEFAULT 0,
    "pf" numeric(12,2) DEFAULT 0,
    "esi" numeric(12,2) DEFAULT 0,
    "professional_tax" numeric(12,2) DEFAULT 0,
    "income_tax" numeric(12,2) DEFAULT 0,
    "other_deductions" numeric(12,2) DEFAULT 0,
    "total_deductions" numeric(12,2) DEFAULT 0,
    "net_salary" numeric(12,2) DEFAULT 0,
    "is_reviewed" boolean DEFAULT false,
    "damage_recovery" numeric(12,2) DEFAULT 0,
    "salary_advance_recovery" numeric(12,2) DEFAULT 0,
    "remarks" "text"
);


ALTER TABLE "public"."payroll_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'employee'::"public"."user_role" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone_number" "text",
    "dob" "date",
    "gender" "text",
    "personal_email" "text",
    "emergency_contact" "text",
    "profile_photo" "text",
    "address" "text",
    "employee_id" "text",
    "department" "text",
    "designation" "text",
    "joining_date" "date",
    "employment_type" "text" DEFAULT 'full-time'::"text",
    "salary" numeric(12,2) DEFAULT 0,
    "experience" integer DEFAULT 0,
    "location" "text" DEFAULT 'office'::"text",
    "status" "public"."employee_status" DEFAULT 'invited'::"public"."employee_status" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "branch" "text" DEFAULT 'Malee House HQ'::"text",
    "office_location" "text" DEFAULT 'Singapore'::"text",
    "operational_zone" "text" DEFAULT 'Central Business District'::"text",
    "reporting_manager_id" "uuid",
    "department_head_id" "uuid",
    "escalation_chain" "uuid"[] DEFAULT '{}'::"uuid"[],
    "approval_authority" boolean DEFAULT false,
    "force_password_reset" boolean DEFAULT false,
    "temp_password_expires_at" timestamp with time zone,
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Central user/employee table. Links to auth.users via id.';



COMMENT ON COLUMN "public"."profiles"."id" IS 'Must match auth.users.id for Supabase Auth integration.';



COMMENT ON COLUMN "public"."profiles"."role" IS 'Application RBAC role — drives all permission checks.';



COMMENT ON COLUMN "public"."profiles"."escalation_chain" IS 'Ordered array of manager UUIDs for escalation routing.';



COMMENT ON COLUMN "public"."profiles"."force_password_reset" IS 'If true, user must change password on next login.';



CREATE TABLE IF NOT EXISTS "public"."project_accounts_owners" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "accountant_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_accounts_owners" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_accounts_owners" IS 'Maps one accountant as the finance owner of each project.';



CREATE TABLE IF NOT EXISTS "public"."project_assignments" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "removed_at" timestamp with time zone
);


ALTER TABLE "public"."project_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_assignments" IS 'Links ops team members to projects. Drives access control and notifications.';



COMMENT ON COLUMN "public"."project_assignments"."role" IS 'Snapshot of user role at time of assignment.';



CREATE TABLE IF NOT EXISTS "public"."project_budget_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "text" NOT NULL,
    "section" "text" NOT NULL,
    "particulars" "text" NOT NULL,
    "qty" numeric DEFAULT 1,
    "rate" numeric DEFAULT 0,
    "days" numeric DEFAULT 1,
    "amount" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_budget_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "text" NOT NULL,
    "project_id" "text",
    "category" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "storage_path" "text",
    "mime_type" "text",
    "file_size" integer,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_finalized" boolean DEFAULT false
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_finances" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "total_quoted_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_invoiced_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_paid_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_finances" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_finances" IS 'Denormalized aggregate finance summary. Updated on each payment verification.';



CREATE TABLE IF NOT EXISTS "public"."project_milestones" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "due_date" "date",
    "linked_stage" "text",
    "is_activation_gate" boolean DEFAULT false NOT NULL,
    "status" "public"."milestone_status" DEFAULT 'pending'::"public"."milestone_status" NOT NULL,
    "is_compulsory" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_milestones" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_milestones" IS 'Billing milestones. Linked stages are gated until milestone is paid.';



COMMENT ON COLUMN "public"."project_milestones"."linked_stage" IS 'Workflow stage that gets unlocked when this milestone is paid.';



COMMENT ON COLUMN "public"."project_milestones"."is_activation_gate" IS 'If true, full project is activated on payment of this milestone.';



COMMENT ON COLUMN "public"."project_milestones"."is_compulsory" IS 'Compulsory milestones cannot be deleted by accountants.';



CREATE TABLE IF NOT EXISTS "public"."project_visits" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "purpose" "text" NOT NULL,
    "notes" "text",
    "assigned_team" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "status" "public"."visit_status" DEFAULT 'scheduled'::"public"."visit_status" NOT NULL,
    "completed_date" "date",
    "report_id" "text",
    "is_billable" boolean DEFAULT false NOT NULL,
    "visit_cost" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_visits" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_visits" IS 'Scheduled field visits and their execution status.';



COMMENT ON COLUMN "public"."project_visits"."assigned_team" IS 'Array of profile UUIDs scheduled for this visit.';



COMMENT ON COLUMN "public"."project_visits"."status" IS 'scheduled | completed | cancelled | paid';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "client_contact" "text",
    "client_address" "text",
    "site_type" "text",
    "site_coordinates" "text",
    "services" "text"[] DEFAULT '{}'::"text"[],
    "survey_requirements" "text",
    "description" "text",
    "status" "text" DEFAULT 'lead'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "requirement_checklist" "jsonb" DEFAULT '{"budget_discussed": false, "satbara_uploaded": false, "timeline_confirmed": false, "site_images_received": false, "measurements_confirmed": false, "client_requirements_verified": false}'::"jsonb",
    "target_completion_date" timestamp with time zone,
    "follow_up_date" timestamp with time zone,
    "is_frozen" boolean DEFAULT false NOT NULL,
    "freeze_reason" "text",
    "frozen_at" timestamp with time zone,
    "frozen_by" "uuid",
    "bypass_active" boolean DEFAULT false NOT NULL,
    "satisfaction_score" integer,
    "archival_note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "budget" numeric DEFAULT 0,
    "dispatch_override_requested" boolean DEFAULT false,
    "dispatch_override_approved" boolean DEFAULT false,
    "gst_number" "text",
    CONSTRAINT "projects_satisfaction_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 10)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Survey/engineering project records. ID format: PRJ-YYMM-NNN.';



COMMENT ON COLUMN "public"."projects"."id" IS 'Human-readable sequential ID. Generated by get_next_project_id() function.';



COMMENT ON COLUMN "public"."projects"."status" IS 'Current workflow stage. Drives the entire lifecycle state machine.';



COMMENT ON COLUMN "public"."projects"."requirement_checklist" IS 'JSONB checklist for pre-quotation requirement gathering.';



COMMENT ON COLUMN "public"."projects"."is_frozen" IS 'If true, all operational work is blocked until outstanding payments are cleared.';



COMMENT ON COLUMN "public"."projects"."bypass_active" IS 'Admin/Engineer can bypass 3-revision CAD escalation hold.';



COMMENT ON COLUMN "public"."projects"."budget" IS 'The allocated budget for the project';



CREATE TABLE IF NOT EXISTS "public"."quotation_templates" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "clauses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."quotation_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_templates" IS 'Reusable T&C clause templates for quotation generation. Only one can be is_default.';



COMMENT ON COLUMN "public"."quotation_templates"."clauses" IS 'JSONB array: [{id, title, content, order}]';



CREATE TABLE IF NOT EXISTS "public"."quotation_versions" (
    "id" "text" NOT NULL,
    "quotation_id" "text" NOT NULL,
    "version_number" integer NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "discount_pct" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(14,2) DEFAULT 0,
    "gst_rate" numeric(5,2) DEFAULT 18 NOT NULL,
    "gst_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "notes" "text" DEFAULT ''::"text",
    "terms" "text" DEFAULT ''::"text",
    "internal_notes" "text" DEFAULT ''::"text",
    "status" "public"."quotation_status" DEFAULT 'Draft'::"public"."quotation_status" NOT NULL,
    "revision_reason" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "clauses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."quotation_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_versions" IS 'Immutable version history snapshots for each quotation revision.';



CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "text" NOT NULL,
    "project_id" "text",
    "quotation_number" "text" NOT NULL,
    "client_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_details" "jsonb",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "discount_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "gst_rate" numeric(5,2) DEFAULT 18 NOT NULL,
    "gst_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "notes" "text" DEFAULT ''::"text",
    "terms" "text" DEFAULT ''::"text",
    "internal_notes" "text" DEFAULT ''::"text",
    "status" "public"."quotation_status" DEFAULT 'Draft'::"public"."quotation_status" NOT NULL,
    "current_version" integer DEFAULT 1 NOT NULL,
    "rejection_category" "text",
    "rejection_reason" "text",
    "client_viewed_at" timestamp with time zone,
    "client_approved_at" timestamp with time zone,
    "client_approver_phone" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "clauses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "bank_id" "uuid",
    "assigned_to" "uuid"
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotations" IS 'Client quotations with versioning and client portal access via client_token.';



COMMENT ON COLUMN "public"."quotations"."client_token" IS 'Unique UUID for client portal link. Shared via WhatsApp/email.';



COMMENT ON COLUMN "public"."quotations"."items" IS 'JSONB: [{id, description, unit, qty, rate, amount}]';



COMMENT ON COLUMN "public"."quotations"."current_version" IS 'Tracks which version is current. History in quotation_versions.';



CREATE TABLE IF NOT EXISTS "public"."salary_increments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "previous_salary" numeric(12,2) NOT NULL,
    "new_salary" numeric(12,2) NOT NULL,
    "increment_amount" numeric(12,2),
    "increment_percentage" numeric(5,2),
    "effective_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."salary_increments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salary_slips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "pdf_url" "text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid",
    "emailed" boolean DEFAULT false,
    "shared" boolean DEFAULT false,
    "status" "text" DEFAULT 'generated'::"text",
    "last_viewed_at" timestamp with time zone,
    "last_downloaded_at" timestamp with time zone,
    "download_count" integer DEFAULT 0,
    "emailed_at" timestamp with time zone,
    "emailed_by" "uuid",
    "shared_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notification_status" "text" DEFAULT 'Pending'::"text",
    "in_app_notified_at" timestamp with time zone
);


ALTER TABLE "public"."salary_slips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sops" (
    "id" "text" DEFAULT ((('sop-'::"text" || (EXTRACT(epoch FROM "now"()))::bigint) || '-'::"text") || "substr"("md5"(("random"())::"text"), 1, 4)) NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "content" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "target_role" "text"
);


ALTER TABLE "public"."sops" OWNER TO "postgres";


COMMENT ON TABLE "public"."sops" IS 'Standard Operating Procedures. Accessible to all active employees.';



CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "text" NOT NULL,
    "project_id" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "stage" "text",
    "assigned_to" "uuid",
    "assigned_by" "uuid",
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "priority" "public"."project_priority" DEFAULT 'medium'::"public"."project_priority",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."tasks" IS 'Project tasks assigned to team members.';



CREATE TABLE IF NOT EXISTS "public"."workflow_history" (
    "id" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "from_stage" "text",
    "to_stage" "text" NOT NULL,
    "comment" "text",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_history" IS 'Append-only history of project stage transitions.';



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_reconciliations"
    ADD CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cad_revisions"
    ADD CONSTRAINT "cad_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_checklist"
    ADD CONSTRAINT "delivery_checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_checklist"
    ADD CONSTRAINT "delivery_checklist_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_financial_ledger"
    ADD CONSTRAINT "employee_financial_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eod_reports"
    ADD CONSTRAINT "eod_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fund_allocations"
    ADD CONSTRAINT "fund_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."holidays"
    ADD CONSTRAINT "holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaves"
    ADD CONSTRAINT "leaves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_requests"
    ADD CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."payroll_adjustment_applications"
    ADD CONSTRAINT "payroll_adjustment_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_audit_logs"
    ADD CONSTRAINT "payroll_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_batch_number_key" UNIQUE ("batch_number");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_payments"
    ADD CONSTRAINT "payroll_payments_payroll_cycle_id_key" UNIQUE ("payroll_cycle_id");



ALTER TABLE ONLY "public"."payroll_payments"
    ADD CONSTRAINT "payroll_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_slip_runs"
    ADD CONSTRAINT "payroll_slip_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_snapshots"
    ADD CONSTRAINT "payroll_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_accounts_owners"
    ADD CONSTRAINT "project_accounts_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_budget_items"
    ADD CONSTRAINT "project_budget_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_finances"
    ADD CONSTRAINT "project_finances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_finances"
    ADD CONSTRAINT "project_finances_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_visits"
    ADD CONSTRAINT "project_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_templates"
    ADD CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_versions"
    ADD CONSTRAINT "quotation_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_quotation_number_key" UNIQUE ("quotation_number");



ALTER TABLE ONLY "public"."salary_increments"
    ADD CONSTRAINT "salary_increments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sops"
    ADD CONSTRAINT "sops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "unique_employee_cycle_slip" UNIQUE ("employee_id", "cycle_id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "unique_month_year_cycle" UNIQUE ("month", "year");



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "unique_snapshot_salary_slip" UNIQUE ("snapshot_id");



ALTER TABLE ONLY "public"."project_accounts_owners"
    ADD CONSTRAINT "uq_project_accountant" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "uq_project_assignment" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."quotation_versions"
    ADD CONSTRAINT "uq_quotation_version" UNIQUE ("quotation_id", "version_number");



ALTER TABLE ONLY "public"."workflow_history"
    ADD CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_project_id" ON "public"."activity_logs" USING "btree" ("project_id");



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_attendance_logs_employee_id_date" ON "public"."attendance_logs" USING "btree" ("employee_id", "date");



CREATE INDEX "idx_bank_reconciliations_bank_id" ON "public"."bank_reconciliations" USING "btree" ("bank_id");



CREATE INDEX "idx_bank_reconciliations_statement_date" ON "public"."bank_reconciliations" USING "btree" ("statement_date");



CREATE INDEX "idx_cad_revisions_project_id" ON "public"."cad_revisions" USING "btree" ("project_id");



CREATE INDEX "idx_cad_revisions_status" ON "public"."cad_revisions" USING "btree" ("status");



CREATE INDEX "idx_cad_revisions_submitted_by" ON "public"."cad_revisions" USING "btree" ("submitted_by");



CREATE INDEX "idx_cad_revisions_type" ON "public"."cad_revisions" USING "btree" ("revision_type");



CREATE INDEX "idx_comments_deleted_at" ON "public"."comments" USING "btree" ("deleted_at");



CREATE INDEX "idx_comments_parent_comment_id" ON "public"."comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_comments_project_id" ON "public"."comments" USING "btree" ("project_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_delivery_checklist_project_id" ON "public"."delivery_checklist" USING "btree" ("project_id");



CREATE INDEX "idx_eod_reports_date" ON "public"."eod_reports" USING "btree" ("date" DESC);



CREATE INDEX "idx_eod_reports_user_id" ON "public"."eod_reports" USING "btree" ("user_id");



CREATE INDEX "idx_expenses_bank_id" ON "public"."expenses" USING "btree" ("bank_id");



CREATE INDEX "idx_expenses_created_by" ON "public"."expenses" USING "btree" ("created_by");



CREATE INDEX "idx_expenses_expense_date" ON "public"."expenses" USING "btree" ("expense_date");



CREATE INDEX "idx_expenses_project_id" ON "public"."expenses" USING "btree" ("project_id");



CREATE INDEX "idx_field_reports_date" ON "public"."field_reports" USING "btree" ("report_date" DESC);



CREATE INDEX "idx_field_reports_project_id" ON "public"."field_reports" USING "btree" ("project_id");



CREATE INDEX "idx_field_reports_status" ON "public"."field_reports" USING "btree" ("status");



CREATE INDEX "idx_field_reports_submitted_by" ON "public"."field_reports" USING "btree" ("submitted_by");



CREATE INDEX "idx_field_reports_type" ON "public"."field_reports" USING "btree" ("report_type");



CREATE INDEX "idx_files_category" ON "public"."files" USING "btree" ("category");



CREATE INDEX "idx_files_deleted_at" ON "public"."files" USING "btree" ("deleted_at");



CREATE INDEX "idx_files_project_id" ON "public"."files" USING "btree" ("project_id");



CREATE INDEX "idx_files_uploaded_by" ON "public"."files" USING "btree" ("uploaded_by");



CREATE INDEX "idx_invoices_created_at" ON "public"."invoices" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("project_id");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_issues_assigned_to" ON "public"."issues" USING "btree" ("assigned_to");



CREATE INDEX "idx_issues_project_id" ON "public"."issues" USING "btree" ("project_id");



CREATE INDEX "idx_issues_status" ON "public"."issues" USING "btree" ("status");



CREATE INDEX "idx_leaves_status" ON "public"."leaves" USING "btree" ("status");



CREATE INDEX "idx_leaves_user_id" ON "public"."leaves" USING "btree" ("user_id");



CREATE INDEX "idx_material_requests_project_id" ON "public"."material_requests" USING "btree" ("project_id");



CREATE INDEX "idx_material_requests_requested_by" ON "public"."material_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_payments_created_at" ON "public"."payments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_project_id" ON "public"."payments" USING "btree" ("project_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_payments_transaction_id" ON "public"."payments" USING "btree" ("transaction_id") WHERE ("transaction_id" IS NOT NULL);



CREATE INDEX "idx_payroll_audit_logs_cycle_id" ON "public"."payroll_audit_logs" USING "btree" ("cycle_id");



CREATE INDEX "idx_payroll_cycles_month_year" ON "public"."payroll_cycles" USING "btree" ("month", "year");



CREATE INDEX "idx_payroll_payments_bank_id" ON "public"."payroll_payments" USING "btree" ("bank_id");



CREATE INDEX "idx_payroll_payments_cycle_id" ON "public"."payroll_payments" USING "btree" ("payroll_cycle_id");



CREATE INDEX "idx_payroll_slip_runs_cycle_id" ON "public"."payroll_slip_runs" USING "btree" ("payroll_cycle_id");



CREATE INDEX "idx_payroll_snapshots_cycle_id" ON "public"."payroll_snapshots" USING "btree" ("cycle_id");



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_profiles_department" ON "public"."profiles" USING "btree" ("department");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_employee_id" ON "public"."profiles" USING "btree" ("employee_id");



CREATE INDEX "idx_profiles_is_active" ON "public"."profiles" USING "btree" ("is_active");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_project_accounts_owners_accountant_id" ON "public"."project_accounts_owners" USING "btree" ("accountant_id");



CREATE INDEX "idx_project_accounts_owners_project_id" ON "public"."project_accounts_owners" USING "btree" ("project_id");



CREATE INDEX "idx_project_assignments_project_id" ON "public"."project_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_project_assignments_role" ON "public"."project_assignments" USING "btree" ("role");



CREATE INDEX "idx_project_assignments_user_id" ON "public"."project_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_project_finances_project_id" ON "public"."project_finances" USING "btree" ("project_id");



CREATE INDEX "idx_project_milestones_linked_stage" ON "public"."project_milestones" USING "btree" ("linked_stage");



CREATE INDEX "idx_project_milestones_project_id" ON "public"."project_milestones" USING "btree" ("project_id");



CREATE INDEX "idx_project_milestones_status" ON "public"."project_milestones" USING "btree" ("status");



CREATE INDEX "idx_project_visits_assigned_team" ON "public"."project_visits" USING "gin" ("assigned_team");



CREATE INDEX "idx_project_visits_date" ON "public"."project_visits" USING "btree" ("scheduled_date");



CREATE INDEX "idx_project_visits_project_id" ON "public"."project_visits" USING "btree" ("project_id");



CREATE INDEX "idx_project_visits_status" ON "public"."project_visits" USING "btree" ("status");



CREATE INDEX "idx_projects_client_name" ON "public"."projects" USING "btree" ("client_name");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_projects_deleted_at" ON "public"."projects" USING "btree" ("deleted_at");



CREATE INDEX "idx_projects_is_frozen" ON "public"."projects" USING "btree" ("is_frozen");



CREATE INDEX "idx_projects_priority" ON "public"."projects" USING "btree" ("priority");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_quotation_templates_category" ON "public"."quotation_templates" USING "btree" ("category");



CREATE UNIQUE INDEX "idx_quotation_templates_default" ON "public"."quotation_templates" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_quotation_versions_quotation_id" ON "public"."quotation_versions" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotations_client_token" ON "public"."quotations" USING "btree" ("client_token");



CREATE UNIQUE INDEX "idx_quotations_client_token_unique" ON "public"."quotations" USING "btree" ("client_token");



CREATE INDEX "idx_quotations_created_at" ON "public"."quotations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_quotations_created_by" ON "public"."quotations" USING "btree" ("created_by");



CREATE INDEX "idx_quotations_project_id" ON "public"."quotations" USING "btree" ("project_id");



CREATE INDEX "idx_quotations_status" ON "public"."quotations" USING "btree" ("status");



CREATE INDEX "idx_sops_category" ON "public"."sops" USING "btree" ("category");



CREATE INDEX "idx_sops_is_active" ON "public"."sops" USING "btree" ("is_active");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_project_id" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_workflow_history_created_at" ON "public"."workflow_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_workflow_history_project_id" ON "public"."workflow_history" USING "btree" ("project_id");



CREATE UNIQUE INDEX "unique_current_reconciliation" ON "public"."bank_reconciliations" USING "btree" ("bank_id", "statement_date") WHERE ("is_current" = true);



CREATE UNIQUE INDEX "unique_default_bank_account" ON "public"."bank_accounts" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE OR REPLACE TRIGGER "on_profile_auth_sync" AFTER INSERT OR UPDATE OF "role", "is_active" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profile_auth_sync"();



CREATE OR REPLACE TRIGGER "on_profile_update_sync_auth" AFTER INSERT OR UPDATE OF "role", "is_active" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_to_auth_users"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."cad_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."delivery_checklist" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."eod_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."field_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."issues" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."leaves" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_finances" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_milestones" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_visits" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."quotation_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."sops" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_profile_role" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_to_auth_users"();



CREATE OR REPLACE TRIGGER "trg_employee_financial_ledger_updated_at" BEFORE UPDATE ON "public"."employee_financial_ledger" FOR EACH ROW EXECUTE FUNCTION "public"."update_employee_financial_ledger_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payroll_adjustment_apps_updated_at" BEFORE UPDATE ON "public"."payroll_adjustment_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_payroll_adjustment_apps_updated_at"();



CREATE OR REPLACE TRIGGER "trg_salary_slips_updated_at" BEFORE UPDATE ON "public"."salary_slips" FOR EACH ROW EXECUTE FUNCTION "public"."update_salary_slips_updated_at"();



CREATE OR REPLACE TRIGGER "update_bank_accounts_updated_at" BEFORE UPDATE ON "public"."bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_fund_allocations_modtime" BEFORE UPDATE ON "public"."fund_allocations" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_project_budget_items_modtime" BEFORE UPDATE ON "public"."project_budget_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_locked_payroll_cycle_id_fkey" FOREIGN KEY ("locked_payroll_cycle_id") REFERENCES "public"."payroll_cycles"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliations"
    ADD CONSTRAINT "bank_reconciliations_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliations"
    ADD CONSTRAINT "bank_reconciliations_reconciled_by_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_reconciliations"
    ADD CONSTRAINT "bank_reconciliations_review_triggered_by_fkey" FOREIGN KEY ("review_triggered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_reconciliations"
    ADD CONSTRAINT "bank_reconciliations_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cad_revisions"
    ADD CONSTRAINT "cad_revisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cad_revisions"
    ADD CONSTRAINT "cad_revisions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cad_revisions"
    ADD CONSTRAINT "cad_revisions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_checklist"
    ADD CONSTRAINT "delivery_checklist_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_financial_ledger"
    ADD CONSTRAINT "employee_financial_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_financial_ledger"
    ADD CONSTRAINT "employee_financial_ledger_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_financial_ledger"
    ADD CONSTRAINT "employee_financial_ledger_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."eod_reports"
    ADD CONSTRAINT "eod_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "fk_invoices_milestone_id" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fund_allocations"
    ADD CONSTRAINT "fund_allocations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fund_allocations"
    ADD CONSTRAINT "fund_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaves"
    ADD CONSTRAINT "leaves_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leaves"
    ADD CONSTRAINT "leaves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_requests"
    ADD CONSTRAINT "material_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_requests"
    ADD CONSTRAINT "material_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_project_id_fkey" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payroll_adjustment_applications"
    ADD CONSTRAINT "payroll_adjustment_applications_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payroll_adjustment_applications"
    ADD CONSTRAINT "payroll_adjustment_applications_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_adjustment_applications"
    ADD CONSTRAINT "payroll_adjustment_applications_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."employee_financial_ledger"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_audit_logs"
    ADD CONSTRAINT "payroll_audit_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_audit_logs"
    ADD CONSTRAINT "payroll_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_checklist_verified_by_fkey" FOREIGN KEY ("checklist_verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_draft_created_by_fkey" FOREIGN KEY ("draft_created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_last_draft_saved_by_fkey" FOREIGN KEY ("last_draft_saved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_submitted_to_accounts_by_fkey" FOREIGN KEY ("submitted_to_accounts_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_payments"
    ADD CONSTRAINT "payroll_payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id");



ALTER TABLE ONLY "public"."payroll_payments"
    ADD CONSTRAINT "payroll_payments_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_payments"
    ADD CONSTRAINT "payroll_payments_payroll_cycle_id_fkey" FOREIGN KEY ("payroll_cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payroll_slip_runs"
    ADD CONSTRAINT "payroll_slip_runs_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_slip_runs"
    ADD CONSTRAINT "payroll_slip_runs_payroll_cycle_id_fkey" FOREIGN KEY ("payroll_cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_slip_runs"
    ADD CONSTRAINT "payroll_slip_runs_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_snapshots"
    ADD CONSTRAINT "payroll_snapshots_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_snapshots"
    ADD CONSTRAINT "payroll_snapshots_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_department_head_id_fkey" FOREIGN KEY ("department_head_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_accounts_owners"
    ADD CONSTRAINT "project_accounts_owners_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_accounts_owners"
    ADD CONSTRAINT "project_accounts_owners_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budget_items"
    ADD CONSTRAINT "project_budget_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_finances"
    ADD CONSTRAINT "project_finances_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_visits"
    ADD CONSTRAINT "project_visits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_visits"
    ADD CONSTRAINT "project_visits_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."field_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_frozen_by_fkey" FOREIGN KEY ("frozen_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotation_templates"
    ADD CONSTRAINT "quotation_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotation_versions"
    ADD CONSTRAINT "quotation_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotation_versions"
    ADD CONSTRAINT "quotation_versions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salary_increments"
    ADD CONSTRAINT "salary_increments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."salary_increments"
    ADD CONSTRAINT "salary_increments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_emailed_by_fkey" FOREIGN KEY ("emailed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."salary_slips"
    ADD CONSTRAINT "salary_slips_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."payroll_snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sops"
    ADD CONSTRAINT "sops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_history"
    ADD CONSTRAINT "workflow_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_history"
    ADD CONSTRAINT "workflow_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Admin and engineers can update material requests" ON "public"."material_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'engineer'::"public"."user_role"]))))));



CREATE POLICY "Admin and engineers can view all material requests" ON "public"."material_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'engineer'::"public"."user_role"]))))));



CREATE POLICY "Admin can perform all actions on files" ON "public"."files" TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can perform all actions on project assignments" ON "public"."project_assignments" TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can perform all actions on projects" ON "public"."projects" TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins and Accountants can do everything on quotation_versions" ON "public"."quotation_versions" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and Accountants can do everything on quotations" ON "public"."quotations" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and Accountants can manage quotation templates" ON "public"."quotation_templates" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and Accountants have full access to company_settings" ON "public"."company_settings" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and Accountants have full access to system_settings" ON "public"."system_settings" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and HR can insert EOD reports for anyone" ON "public"."eod_reports" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can insert salary increments" ON "public"."salary_increments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"]))))));



CREATE POLICY "Admins and HR can manage all salary slips" ON "public"."salary_slips" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"]))))));



CREATE POLICY "Admins and HR can manage announcements" ON "public"."announcements" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can manage documents" ON "public"."employee_documents" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can manage holidays" ON "public"."holidays" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can read all EOD reports" ON "public"."eod_reports" FOR SELECT USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can read all leaves" ON "public"."leaves" FOR SELECT USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and HR can read all salary increments" ON "public"."salary_increments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"]))))));



CREATE POLICY "Admins and HR can update leaves" ON "public"."leaves" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Admins and accountants can insert reconciliations" ON "public"."bank_reconciliations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Admins and accountants can manage all expenses" ON "public"."expenses" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))) WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Admins and accountants can manage reconciliations" ON "public"."bank_reconciliations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Admins and accountants can view reconciliations" ON "public"."bank_reconciliations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Admins can delete files" ON "public"."files" FOR DELETE USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can delete project visits" ON "public"."project_visits" FOR DELETE USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can do everything on profiles" ON "public"."profiles" USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can manage all notifications" ON "public"."notifications" USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can manage assignments" ON "public"."project_assignments" USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can update EOD reports" ON "public"."eod_reports" FOR UPDATE USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view all history" ON "public"."workflow_history" FOR SELECT USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view all logs" ON "public"."activity_logs" FOR SELECT USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins have full access to attendance_logs" ON "public"."attendance_logs" USING (("public"."get_user_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "Admins, Sales, and Accountants can read all projects" ON "public"."projects" FOR SELECT USING ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role", 'accountant'::"public"."user_role"])) AND ("deleted_at" IS NULL)));



CREATE POLICY "Allow all authenticated users" ON "public"."activity_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."attendance" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."cad_revisions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."comments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."delivery_checklist" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."field_reports" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."invoices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."issues" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."leaves" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."notifications" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."payments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."payroll" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."project_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."project_files" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."project_milestones" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."quotations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."sops" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users" ON "public"."workflow_history" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can create comments" ON "public"."comments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create tasks" ON "public"."tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert activity logs" ON "public"."activity_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert workflow history" ON "public"."workflow_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view announcements" ON "public"."announcements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view company_settings" ON "public"."company_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view holidays" ON "public"."holidays" FOR SELECT USING (true);



CREATE POLICY "Anyone can view system_settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Assigned users can perform all actions on files for their proje" ON "public"."files" TO "authenticated" USING (("project_id" IN ( SELECT "public"."get_my_project_ids"() AS "get_my_project_ids")));



CREATE POLICY "Assigned users can update tasks" ON "public"."tasks" FOR UPDATE USING ((("assigned_to" = "auth"."uid"()) OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Assigned users can update their projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("id" IN ( SELECT "public"."get_my_project_ids"() AS "get_my_project_ids")));



CREATE POLICY "Assigned users can view assignments for their projects" ON "public"."project_assignments" FOR SELECT TO "authenticated" USING (("project_id" IN ( SELECT "public"."get_my_project_ids"() AS "get_my_project_ids")));



CREATE POLICY "Assigned users can view projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "public"."get_my_project_ids"() AS "get_my_project_ids")));



CREATE POLICY "Authenticated users can read all profiles" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read quotation templates" ON "public"."quotation_templates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view company_settings" ON "public"."company_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view system_settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authorized roles can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Authorized roles can update projects" ON "public"."projects" FOR UPDATE USING ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role", 'accountant'::"public"."user_role"])) OR (("public"."get_user_role"() = ANY (ARRAY['engineer'::"public"."user_role", 'cad'::"public"."user_role", 'field'::"public"."user_role", 'field_engineer'::"public"."user_role", 'qc'::"public"."user_role"])) AND "public"."is_project_participant"("id"))));



CREATE POLICY "Authors can delete comments" ON "public"."comments" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Authors can update comments" ON "public"."comments" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "CAD can insert own revisions" ON "public"."cad_revisions" FOR INSERT WITH CHECK ((("public"."get_user_role"() = 'cad'::"public"."user_role") AND ("submitted_by" = "auth"."uid"())));



CREATE POLICY "Employees can read own salary increments" ON "public"."salary_increments" FOR SELECT USING (("employee_id" = "auth"."uid"()));



CREATE POLICY "Employees can read own salary slips" ON "public"."salary_slips" FOR SELECT USING (("employee_id" = "auth"."uid"()));



CREATE POLICY "Enable delete for admin and accountant" ON "public"."bank_accounts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Enable delete for authenticated users" ON "public"."fund_allocations" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."project_budget_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for admin and accountant" ON "public"."bank_accounts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Enable insert for authenticated users" ON "public"."fund_allocations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."project_budget_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."fund_allocations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."project_budget_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all internal users" ON "public"."bank_accounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'sales'::"public"."user_role", 'engineer'::"public"."user_role", 'qc'::"public"."user_role"]))))));



CREATE POLICY "Enable update for admin and accountant" ON "public"."bank_accounts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"]))))));



CREATE POLICY "Enable update for authenticated users" ON "public"."fund_allocations" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."project_budget_items" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Engineers and Admins can update field reports" ON "public"."field_reports" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['engineer'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "Engineers and Admins can update revisions" ON "public"."cad_revisions" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['engineer'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "Engineers can insert/update/delete assignments" ON "public"."project_assignments" TO "authenticated" USING ("public"."is_engineer"());



CREATE POLICY "Engineers can manage assignments" ON "public"."project_assignments" USING (("public"."get_user_role"() = 'engineer'::"public"."user_role"));



CREATE POLICY "Engineers can view all projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ("public"."is_engineer"());



CREATE POLICY "Field can insert own reports" ON "public"."field_reports" FOR INSERT WITH CHECK ((("public"."get_user_role"() = ANY (ARRAY['field'::"public"."user_role", 'field_engineer'::"public"."user_role"])) AND ("submitted_by" = "auth"."uid"())));



CREATE POLICY "Finance Full Access finances" ON "public"."project_finances" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Finance Full Access invoices" ON "public"."invoices" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Finance Full Access milestones" ON "public"."project_milestones" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Finance Full Access owners" ON "public"."project_accounts_owners" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Finance Full Access payments" ON "public"."payments" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "HR can read all EOD reports" ON "public"."eod_reports" FOR SELECT USING (("public"."get_user_role"() = 'hr'::"public"."user_role"));



CREATE POLICY "HR can read all attendance logs" ON "public"."attendance_logs" FOR SELECT USING (("public"."get_user_role"() = 'hr'::"public"."user_role"));



CREATE POLICY "HR can read all leaves" ON "public"."leaves" FOR SELECT USING (("public"."get_user_role"() = 'hr'::"public"."user_role"));



CREATE POLICY "HR can update EOD reports" ON "public"."eod_reports" FOR UPDATE USING (("public"."get_user_role"() = 'hr'::"public"."user_role"));



CREATE POLICY "HR can view all profiles" ON "public"."profiles" FOR SELECT USING (("public"."get_user_role"() = 'hr'::"public"."user_role"));



CREATE POLICY "HR, Accountants, and Admins can manage payroll_cycles" ON "public"."payroll_cycles" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "HR, Accountants, and Admins can manage payroll_snapshots" ON "public"."payroll_snapshots" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'hr'::"public"."user_role"])));



CREATE POLICY "Ops and Admins can insert project visits" ON "public"."project_visits" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['field'::"public"."user_role", 'field_engineer'::"public"."user_role", 'engineer'::"public"."user_role", 'admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Ops and Admins can update project visits" ON "public"."project_visits" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['field'::"public"."user_role", 'field_engineer'::"public"."user_role", 'engineer'::"public"."user_role", 'admin'::"public"."user_role", 'accountant'::"public"."user_role"])));



CREATE POLICY "Participant Read Access finances" ON "public"."project_finances" FOR SELECT USING ("public"."is_project_participant"("project_id"));



CREATE POLICY "Participant Read Access invoices" ON "public"."invoices" FOR SELECT USING ("public"."is_project_participant"("project_id"));



CREATE POLICY "Participant Read Access milestones" ON "public"."project_milestones" FOR SELECT USING ("public"."is_project_participant"("project_id"));



CREATE POLICY "Participant Read Access payments" ON "public"."payments" FOR SELECT USING ("public"."is_project_participant"("project_id"));



CREATE POLICY "Participants can read comments" ON "public"."comments" FOR SELECT USING (("public"."is_project_participant"("project_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role", 'accountant'::"public"."user_role"]))));



CREATE POLICY "Participants can read tasks" ON "public"."tasks" FOR SELECT USING (("public"."is_project_participant"("project_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role", 'accountant'::"public"."user_role"]))));



CREATE POLICY "Participants can view cad revisions" ON "public"."cad_revisions" FOR SELECT USING (("public"."is_project_participant"("project_id") OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Participants can view field reports" ON "public"."field_reports" FOR SELECT USING (("public"."is_project_participant"("project_id") OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Participants can view project visits" ON "public"."project_visits" FOR SELECT USING (("public"."is_project_participant"("project_id") OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Public can view quotation by token" ON "public"."quotations" FOR SELECT USING (true);



CREATE POLICY "Public can view quotation_versions by token" ON "public"."quotation_versions" FOR SELECT USING (true);



CREATE POLICY "Sales can view quotation_versions" ON "public"."quotation_versions" FOR SELECT USING (("public"."get_user_role"() = 'sales'::"public"."user_role"));



CREATE POLICY "Sales can view quotations" ON "public"."quotations" FOR SELECT USING (("public"."get_user_role"() = 'sales'::"public"."user_role"));



CREATE POLICY "Users can delete own tasks" ON "public"."tasks" FOR DELETE USING ((("assigned_to" = "auth"."uid"()) OR ("public"."get_user_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "Users can insert files based on role or assignment" ON "public"."files" FOR INSERT WITH CHECK ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'engineer'::"public"."user_role", 'sales'::"public"."user_role"])) OR "public"."is_project_participant"("project_id")));



CREATE POLICY "Users can insert own EOD reports" ON "public"."eod_reports" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own leaves" ON "public"."leaves" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own material requests" ON "public"."material_requests" FOR INSERT WITH CHECK (("requested_by" = "auth"."uid"()));



CREATE POLICY "Users can manage own notifications" ON "public"."notifications" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own EOD reports" ON "public"."eod_reports" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own leaves" ON "public"."leaves" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can read projects based on role or assignment" ON "public"."projects" FOR SELECT USING ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'engineer'::"public"."user_role", 'sales'::"public"."user_role"])) OR "public"."is_project_participant"("id")));



CREATE POLICY "Users can see their own assignments" ON "public"."project_assignments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update files based on role or assignment" ON "public"."files" FOR UPDATE USING ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'engineer'::"public"."user_role", 'sales'::"public"."user_role"])) OR "public"."is_project_participant"("project_id")));



CREATE POLICY "Users can update own pending leaves" ON "public"."leaves" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("status" = 'pending'::"public"."leave_status")));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view files based on role or assignment" ON "public"."files" FOR SELECT USING ((("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'accountant'::"public"."user_role", 'engineer'::"public"."user_role", 'sales'::"public"."user_role"])) OR "public"."is_project_participant"("project_id")));



CREATE POLICY "Users can view their own documents" ON "public"."employee_documents" FOR SELECT USING ((("auth"."uid"() = "employee_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"public"."user_role", 'hr'::"public"."user_role"]))));



CREATE POLICY "Users can view their own material requests" ON "public"."material_requests" FOR SELECT USING (("requested_by" = "auth"."uid"()));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_reconciliations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cad_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_checklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eod_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."material_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_accounts_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_budget_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_finances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."salary_increments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."salary_slips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sops" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_history" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "authenticator";































































































































































GRANT ALL ON FUNCTION "public"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_backdated_reconciliations"("p_bank_id" "uuid", "p_transaction_date" "date", "p_trigger_type" "text", "p_triggered_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."flag_backdated_reconciliations"("p_bank_id" "uuid", "p_transaction_date" "date", "p_trigger_type" "text", "p_triggered_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_backdated_reconciliations"("p_bank_id" "uuid", "p_transaction_date" "date", "p_trigger_type" "text", "p_triggered_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_system_notification"("p_target_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_related_project_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_system_notification"("p_target_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_related_project_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_system_notification"("p_target_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_related_project_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_project_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_project_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_project_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_project_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_project_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_project_id"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_next_project_id"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_next_project_id"() TO "authenticator";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticator";



GRANT ALL ON FUNCTION "public"."handle_profile_auth_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_profile_auth_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_profile_auth_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_engineer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_engineer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_engineer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_participant"("p_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_participant"("p_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_participant"("p_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_project_participant"("p_id" "text") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."is_project_participant"("p_id" "text") TO "authenticator";



GRANT ALL ON FUNCTION "public"."rpc_lock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_lock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_lock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_unlock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_unlock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_unlock_payroll_cycle"("p_cycle_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_reconciliation"("p_bank_id" "uuid", "p_statement_date" "date", "p_statement_balance" numeric, "p_notes" "text", "p_status" "text", "p_adjustment_amount" numeric, "p_adjustment_reason" "text", "p_reconciled_by" "uuid", "p_opening_balance" numeric, "p_erp_balance" numeric, "p_transaction_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."save_reconciliation"("p_bank_id" "uuid", "p_statement_date" "date", "p_statement_balance" numeric, "p_notes" "text", "p_status" "text", "p_adjustment_amount" numeric, "p_adjustment_reason" "text", "p_reconciled_by" "uuid", "p_opening_balance" numeric, "p_erp_balance" numeric, "p_transaction_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_reconciliation"("p_bank_id" "uuid", "p_statement_date" "date", "p_statement_balance" numeric, "p_notes" "text", "p_status" "text", "p_adjustment_amount" numeric, "p_adjustment_reason" "text", "p_reconciled_by" "uuid", "p_opening_balance" numeric, "p_erp_balance" numeric, "p_transaction_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticator";



GRANT ALL ON FUNCTION "public"."sign"("payload" json, "secret" "text", "algorithm" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."sign"("payload" json, "secret" "text", "algorithm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sign"("payload" json, "secret" "text", "algorithm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sign"("payload" json, "secret" "text", "algorithm" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_to_auth_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_to_auth_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_to_auth_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."try_cast_double"("inp" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."try_cast_double"("inp" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."try_cast_double"("inp" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_cast_double"("inp" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employee_financial_ledger_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_employee_financial_ledger_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employee_financial_ledger_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payroll_adjustment_apps_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payroll_adjustment_apps_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payroll_adjustment_apps_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_salary_slips_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_salary_slips_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_salary_slips_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."url_decode"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."url_decode"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."url_decode"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."url_decode"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."url_encode"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."url_encode"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."url_encode"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."url_encode"("data" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "service_role";



























GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";
GRANT ALL ON TABLE "public"."activity_logs" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticator";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."bank_reconciliations" TO "anon";
GRANT ALL ON TABLE "public"."bank_reconciliations" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_reconciliations" TO "service_role";



GRANT ALL ON TABLE "public"."cad_revisions" TO "anon";
GRANT ALL ON TABLE "public"."cad_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."cad_revisions" TO "service_role";
GRANT ALL ON TABLE "public"."cad_revisions" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."cad_revisions" TO "authenticator";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";
GRANT ALL ON TABLE "public"."comments" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."comments" TO "authenticator";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_checklist" TO "anon";
GRANT ALL ON TABLE "public"."delivery_checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_checklist" TO "service_role";
GRANT ALL ON TABLE "public"."delivery_checklist" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."delivery_checklist" TO "authenticator";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_financial_ledger" TO "anon";
GRANT ALL ON TABLE "public"."employee_financial_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_financial_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."eod_reports" TO "anon";
GRANT ALL ON TABLE "public"."eod_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."eod_reports" TO "service_role";
GRANT ALL ON TABLE "public"."eod_reports" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."eod_reports" TO "authenticator";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."field_reports" TO "anon";
GRANT ALL ON TABLE "public"."field_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."field_reports" TO "service_role";
GRANT ALL ON TABLE "public"."field_reports" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."field_reports" TO "authenticator";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";
GRANT ALL ON TABLE "public"."files" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."files" TO "authenticator";



GRANT ALL ON TABLE "public"."fund_allocations" TO "anon";
GRANT ALL ON TABLE "public"."fund_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."fund_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."holidays" TO "anon";
GRANT ALL ON TABLE "public"."holidays" TO "authenticated";
GRANT ALL ON TABLE "public"."holidays" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";
GRANT ALL ON TABLE "public"."invoices" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."invoices" TO "authenticator";



GRANT ALL ON TABLE "public"."issues" TO "anon";
GRANT ALL ON TABLE "public"."issues" TO "authenticated";
GRANT ALL ON TABLE "public"."issues" TO "service_role";
GRANT ALL ON TABLE "public"."issues" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."issues" TO "authenticator";



GRANT ALL ON TABLE "public"."leaves" TO "anon";
GRANT ALL ON TABLE "public"."leaves" TO "authenticated";
GRANT ALL ON TABLE "public"."leaves" TO "service_role";
GRANT ALL ON TABLE "public"."leaves" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."leaves" TO "authenticator";



GRANT ALL ON TABLE "public"."material_requests" TO "anon";
GRANT ALL ON TABLE "public"."material_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."material_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT ALL ON TABLE "public"."notifications" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."notifications" TO "authenticator";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";
GRANT ALL ON TABLE "public"."payments" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."payments" TO "authenticator";



GRANT ALL ON TABLE "public"."payroll" TO "anon";
GRANT ALL ON TABLE "public"."payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_adjustment_applications" TO "anon";
GRANT ALL ON TABLE "public"."payroll_adjustment_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_adjustment_applications" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."payroll_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_cycles" TO "anon";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_payments" TO "anon";
GRANT ALL ON TABLE "public"."payroll_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_payments" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_slip_runs" TO "anon";
GRANT ALL ON TABLE "public"."payroll_slip_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_slip_runs" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."payroll_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."profiles" TO "authenticator";



GRANT ALL ON TABLE "public"."project_accounts_owners" TO "anon";
GRANT ALL ON TABLE "public"."project_accounts_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."project_accounts_owners" TO "service_role";
GRANT ALL ON TABLE "public"."project_accounts_owners" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."project_accounts_owners" TO "authenticator";



GRANT ALL ON TABLE "public"."project_assignments" TO "anon";
GRANT ALL ON TABLE "public"."project_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_assignments" TO "service_role";
GRANT ALL ON TABLE "public"."project_assignments" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."project_assignments" TO "authenticator";



GRANT ALL ON TABLE "public"."project_budget_items" TO "anon";
GRANT ALL ON TABLE "public"."project_budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."project_budget_items" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."project_finances" TO "anon";
GRANT ALL ON TABLE "public"."project_finances" TO "authenticated";
GRANT ALL ON TABLE "public"."project_finances" TO "service_role";
GRANT ALL ON TABLE "public"."project_finances" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."project_finances" TO "authenticator";



GRANT ALL ON TABLE "public"."project_milestones" TO "anon";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestones" TO "service_role";
GRANT ALL ON TABLE "public"."project_milestones" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticator";



GRANT ALL ON TABLE "public"."project_visits" TO "anon";
GRANT ALL ON TABLE "public"."project_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."project_visits" TO "service_role";
GRANT ALL ON TABLE "public"."project_visits" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."project_visits" TO "authenticator";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";
GRANT ALL ON TABLE "public"."projects" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."projects" TO "authenticator";



GRANT ALL ON TABLE "public"."quotation_templates" TO "anon";
GRANT ALL ON TABLE "public"."quotation_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_templates" TO "service_role";
GRANT ALL ON TABLE "public"."quotation_templates" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."quotation_templates" TO "authenticator";



GRANT ALL ON TABLE "public"."quotation_versions" TO "anon";
GRANT ALL ON TABLE "public"."quotation_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_versions" TO "service_role";
GRANT ALL ON TABLE "public"."quotation_versions" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."quotation_versions" TO "authenticator";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";
GRANT ALL ON TABLE "public"."quotations" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."quotations" TO "authenticator";



GRANT ALL ON TABLE "public"."salary_increments" TO "anon";
GRANT ALL ON TABLE "public"."salary_increments" TO "authenticated";
GRANT ALL ON TABLE "public"."salary_increments" TO "service_role";



GRANT ALL ON TABLE "public"."salary_slips" TO "anon";
GRANT ALL ON TABLE "public"."salary_slips" TO "authenticated";
GRANT ALL ON TABLE "public"."salary_slips" TO "service_role";



GRANT ALL ON TABLE "public"."sops" TO "anon";
GRANT ALL ON TABLE "public"."sops" TO "authenticated";
GRANT ALL ON TABLE "public"."sops" TO "service_role";
GRANT ALL ON TABLE "public"."sops" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."sops" TO "authenticator";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";
GRANT ALL ON TABLE "public"."tasks" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."tasks" TO "authenticator";



GRANT ALL ON TABLE "public"."workflow_history" TO "anon";
GRANT ALL ON TABLE "public"."workflow_history" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_history" TO "service_role";
GRANT ALL ON TABLE "public"."workflow_history" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."workflow_history" TO "authenticator";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































