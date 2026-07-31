import { createClient } from '@supabase/supabase-js'

/** Anon client for public share pages — never use service role here. */
function publicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Supabase public env not configured')
  return createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function fetchPublicInvoice(id: string, token?: string | null) {
  if (token) {
    const resolved = await resolveShareToken(token)
    if (!resolved || resolved.resource_type !== 'invoice') return null
    return resolved.data
  }
  if (!id || id.length > 80) return null
  const supabase = publicSupabase()
  const { data, error } = await supabase.rpc('get_public_invoice', { p_id: id })
  if (error) {
    console.error('get_public_invoice:', error.message)
    return null
  }
  return data
}

export async function fetchPublicReceipt(
  id: string,
  type: 'invoice' | 'milestone',
  token?: string | null
) {
  if (token) {
    const resolved = await resolveShareToken(token)
    if (!resolved) return null
    if (type === 'milestone' && resolved.resource_type !== 'receipt_milestone') return null
    if (type === 'invoice' && resolved.resource_type !== 'receipt_invoice') return null
    return resolved.data
  }
  if (!id || id.length > 80) return null
  const supabase = publicSupabase()
  const { data, error } = await supabase.rpc('get_public_receipt', {
    p_id: id,
    p_type: type,
  })
  if (error) {
    console.error('get_public_receipt:', error.message)
    return null
  }
  return data
}

async function resolveShareToken(token: string) {
  // UUID only
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return null
  }
  const supabase = publicSupabase()
  const { data, error } = await supabase.rpc('resolve_public_share_token', {
    p_token: token,
  })
  if (error || !data) return null
  return data as {
    resource_type: string
    resource_id: string
    expires_at: string
    data: any
  }
}
