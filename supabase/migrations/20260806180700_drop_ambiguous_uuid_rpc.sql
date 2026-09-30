-- Migration to drop the ambiguous uuid RPC functions that were causing candidate function errors

DROP FUNCTION IF EXISTS get_revenue_by_project(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_expense_by_category(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_income_statement_transactions(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_balance_sheet_summary(timestamptz, uuid);
DROP FUNCTION IF EXISTS get_project_statement_summary(uuid);
DROP FUNCTION IF EXISTS get_project_budget_sheet_summary(uuid);
DROP FUNCTION IF EXISTS get_project_actual_sheet_summary(uuid);
