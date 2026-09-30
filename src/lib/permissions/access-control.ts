import { Role } from './roles'
import { cache } from 'react'

export type AuthContext = {
  userId: string
  role: Role
  error?: string
}

/**
 * Single auth path for the request: reuses getUserProfileAction's React cache
 * so requireAuthContext + getUserProfileAction share one getUser + one profiles row.
 */
export const requireAuthContext = cache(async (): Promise<AuthContext> => {
  // Dynamic import avoids circular deps with actions that import this helper
  const { getUserProfileAction } = await import('@/actions/auth.actions')
  const profile: any = await getUserProfileAction()

  if (!profile) {
    return { userId: '', role: 'field' as Role, error: 'Unauthorized access. Please log in.' }
  }

  if (!profile.is_active) {
    return {
      userId: profile.id,
      role: profile.role as Role,
      error: 'Account suspended.',
    }
  }

  return { userId: profile.id, role: profile.role as Role }
})
