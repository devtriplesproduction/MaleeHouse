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
 * recordPaymentAction
 * Strictly for accountants and admins to verify project payment.
 */
export async function recordPaymentAction(projectId: string): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: "Access denied. Only Accountants and Admins can record payments." };
    }

    // 2. Update Project Status using centralized workflow engine
    const stageResponse = await updateProjectStageAction(projectId, 'payment_done', "Payment verified by finance department.");
    
    if (!stageResponse.success) {
      return { success: false, error: stageResponse.error || "Failed to update project workflow." };
    }

    const supabase: any = await createClient();
    // 3. Log to Supabase Activity Logs (Audit Trail)
    await supabase.from('activity_logs').insert({
      project_id: projectId,
      user_id: auth.userId,
      action: 'PAYMENT_RECORDED',
      details: { 
        message: "Payment verified and recorded.",
        timestamp: new Date().toISOString()
      }
    } as any);

    await revalidateAccountsPaths(projectId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * markAsInvoicedAction
 * Records that an invoice has been generated for the project.
 */
export async function markAsInvoicedAction(projectId: string): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    await supabase.from('activity_logs').insert({
      project_id: projectId,
      user_id: auth.userId,
      action: 'INVOICE_GENERATED',
      details: { 
        message: "Invoice has been sent to client."
      }
    } as any);

    await revalidateAccountsPaths(projectId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
