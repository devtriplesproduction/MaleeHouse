-- 20260719000071_payroll_transactions.sql

-- 1. Lock Payroll Transaction
CREATE OR REPLACE FUNCTION public.rpc_lock_payroll_cycle(p_cycle_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Unlock Payroll Transaction
CREATE OR REPLACE FUNCTION public.rpc_unlock_payroll_cycle(p_cycle_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
