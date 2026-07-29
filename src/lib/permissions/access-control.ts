import { createClient } from '@/lib/supabase/server'
import { Role } from './roles'

export type AuthContext = {
  userId: string
  role: Role
  error?: string
}

export async function requireAuthContext(): Promise<AuthContext> {
  const supabase: any = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { userId: '', role: 'field' as Role, error: 'Unauthorized access. Please log in.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { userId: user.id, role: 'field' as Role, error: 'Profile not found.' }
  }

  if (!profile.is_active) {
    return { userId: user.id, role: profile.role as Role, error: 'Account suspended.' }
  }

  return { userId: user.id, role: profile.role as Role }
}
