'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfileAction } from '@/actions/auth.actions'

export type ShareResourceType = 'invoice' | 'receipt_invoice' | 'receipt_milestone'

/**
 * Create a time-limited public share token (UUID). Prefer this over raw IDs in emails.
 */
export async function createPublicShareLinkAction(
  resourceType: ShareResourceType,
  resourceId: string,
  ttlHours = 168
): Promise<{ success: boolean; url?: string; token?: string; error?: string }> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'accountant', 'sales'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase: any = await createClient()
    const { data: token, error } = await supabase.rpc('create_public_share_token', {
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_ttl_hours: ttlHours,
    })

    if (error || !token) {
      return { success: false, error: error?.message || 'Failed to create share token' }
    }

    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'http://localhost:3000'

    const path =
      resourceType === 'invoice'
        ? `/invoices/${resourceId}?token=${token}`
        : resourceType === 'receipt_milestone'
          ? `/receipts/${resourceId}?type=milestone&token=${token}`
          : `/receipts/${resourceId}?type=invoice&token=${token}`

    return { success: true, token, url: `${base}${path}` }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
