-- Migration: Create RPC for transactional invoice deletion

CREATE OR REPLACE FUNCTION delete_invoice_transactionally(p_invoice_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_milestone_id text;
    v_project_id text;
    v_payment_exists boolean;
    v_other_active_invoices_exist boolean;
BEGIN
    -- 1. Lock the invoice row to prevent concurrent modifications
    SELECT milestone_id, project_id 
    INTO v_milestone_id, v_project_id
    FROM invoices 
    WHERE id = p_invoice_id 
    FOR UPDATE;

    -- If invoice doesn't exist, we just return (or raise error, but returning is fine)
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- 2. Check if any payments exist for this invoice
    SELECT EXISTS (
        SELECT 1 FROM payments WHERE invoice_id = p_invoice_id
    ) INTO v_payment_exists;

    IF v_payment_exists THEN
        RAISE EXCEPTION 'Cannot delete an invoice that has payments logged against it.';
    END IF;

    -- 3. Delete the invoice
    DELETE FROM invoices WHERE id = p_invoice_id;

    -- 4. Revert milestone status if applicable
    IF v_milestone_id IS NOT NULL THEN
        -- Check if there are ANY OTHER active invoices for this milestone
        -- Active means not cancelled and not rejected
        SELECT EXISTS (
            SELECT 1 FROM invoices 
            WHERE milestone_id = v_milestone_id 
              AND status NOT IN ('cancelled', 'rejected')
        ) INTO v_other_active_invoices_exist;

        -- If no other active invoices exist, set the milestone back to pending
        IF NOT v_other_active_invoices_exist THEN
            UPDATE project_milestones
            SET status = 'pending',
                updated_at = NOW()
            WHERE id = v_milestone_id;
        END IF;
    END IF;
END;
$$;
