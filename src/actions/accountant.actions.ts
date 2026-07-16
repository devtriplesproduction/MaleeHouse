'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateProjectStageAction } from "./workflow.actions";
import { requireAuthContext } from "@/lib/permissions/permissions";
import { revalidateAccountsPaths } from "@/actions/revalidate-utils";

export type ActionResponse = {
  success: boolean;
  error?: string;
};

/**
 * @deprecated Use logPaymentAction in finance.actions.ts instead.
 * recordPaymentAction
 * Strictly for accountants and admins to verify project payment.
 */
export async function recordPaymentAction(projectId: string): Promise<ActionResponse> {
  return { success: false, error: "recordPaymentAction is deprecated. Use logPaymentAction in finance.actions.ts." };
}

/**
 * @deprecated Use createInvoiceAction in finance.actions.ts instead.
 * markAsInvoicedAction
 * Records that an invoice has been generated for the project.
 */
export async function markAsInvoicedAction(projectId: string): Promise<ActionResponse> {
  return { success: false, error: "markAsInvoicedAction is deprecated. Use createInvoiceAction in finance.actions.ts." };
}
