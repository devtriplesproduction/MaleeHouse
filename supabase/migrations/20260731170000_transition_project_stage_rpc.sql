-- Single-round-trip stage transition after app-level gates pass.
-- Updates project, writes history + activity, clears override, inserts stage tasks.

CREATE OR REPLACE FUNCTION public.transition_project_stage(
  p_project_id text,
  p_to_stage text,
  p_user_id uuid,
  p_role text,
  p_comment text DEFAULT NULL,
  p_clear_override boolean DEFAULT false,
  p_task_titles text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_from text;
  v_now timestamptz := now();
  v_hist_id text;
  v_title text;
  v_due timestamptz := v_now + interval '2 days';
  v_project public.projects%ROWTYPE;
BEGIN
  SELECT * INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Project not found');
  END IF;

  IF v_project.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Project is deleted');
  END IF;

  IF v_project.status IN ('completed', 'archived') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Project is locked (completed/archived)');
  END IF;

  IF v_project.is_frozen IS TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PROJECT FROZEN: outstanding payments');
  END IF;

  v_from := v_project.status;

  UPDATE public.projects
  SET
    status = p_to_stage,
    updated_at = v_now,
    dispatch_override_approved = CASE
      WHEN p_clear_override THEN false
      ELSE dispatch_override_approved
    END
  WHERE id = p_project_id
  RETURNING * INTO v_project;

  v_hist_id := 'wh-' || extract(epoch from v_now)::bigint || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.workflow_history (
    id, project_id, from_stage, to_stage, changed_by, comment, created_at
  ) VALUES (
    v_hist_id,
    p_project_id,
    v_from,
    p_to_stage,
    p_user_id,
    COALESCE(p_comment, 'Status updated by ' || COALESCE(p_role, 'user')),
    v_now
  );

  INSERT INTO public.activity_logs (
    id, project_id, user_id, action, details, created_at
  ) VALUES (
    'act-' || extract(epoch from v_now)::bigint || '-' || substr(md5(random()::text), 1, 6),
    p_project_id,
    p_user_id,
    'STAGE_UPDATE',
    jsonb_build_object(
      'from_status', v_from,
      'new_status', p_to_stage,
      'role', p_role
    ),
    v_now
  );

  IF p_task_titles IS NOT NULL AND array_length(p_task_titles, 1) > 0 THEN
    FOREACH v_title IN ARRAY p_task_titles LOOP
      INSERT INTO public.tasks (
        id, project_id, stage, title, status, due_date, created_at, updated_at
      ) VALUES (
        'tsk-' || extract(epoch from v_now)::bigint || '-' || substr(md5(random()::text || v_title), 1, 6),
        p_project_id,
        p_to_stage,
        initcap(replace(v_title, '_', ' ')),
        'pending',
        v_due,
        v_now,
        v_now
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'from_stage', v_from,
    'to_stage', p_to_stage,
    'project', to_jsonb(v_project)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transition_project_stage(text, text, uuid, text, text, boolean, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_project_stage(text, text, uuid, text, text, boolean, text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.transition_project_stage(text, text, uuid, text, text, boolean, text[]) TO authenticated, service_role;
