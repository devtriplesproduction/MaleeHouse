import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_REDIRECTS, PATH_PERMISSIONS, Role } from '../permissions/roles'

// Pre-sort once at module load (not per request)
const SORTED_PATH_PERMISSIONS = Object.entries(PATH_PERMISSIONS).sort(
  (a, b) => b[0].length - a[0].length
)

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes('auth-token') ||
        c.name.startsWith('sb-') ||
        c.name.includes('supabase')
    )
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie.name, cookie.value))
}

function isPublicPath(path: string, isAuthPage: boolean): boolean {
  return (
    isAuthPage ||
    path === '/' ||
    path.startsWith('/client-portal') ||
    path.startsWith('/api/cron') ||
    path.startsWith('/invoices/') ||
    path.startsWith('/receipts/') ||
    path.startsWith('/hire/') ||
    path.startsWith('/unauthorized') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/')
  )
}

/**
 * Edge session + RBAC gateway.
 * Optimizations:
 * - Skip Auth network call when public route has no session cookie
 * - Prefer JWT app_metadata.role / is_active (no profiles query)
 * - Pre-sorted path permissions
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/login')
  const publicRoute = isPublicPath(path, isAuthPage)
  const hasCookie = hasSupabaseAuthCookie(request)

  // Fast path: public page, no session cookie → zero Auth / DB calls
  if (publicRoute && !hasCookie && !isAuthPage) {
    return NextResponse.next({ request })
  }

  // Login page without cookie: no need to call getUser
  if (isAuthPage && !hasCookie) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null
  try {
    // getUser validates JWT with Auth API (secure); required when cookie present
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (e) {
    console.error('Middleware getUser failed:', e)
    return supabaseResponse
  }

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  if (!user) {
    return supabaseResponse
  }

  // Prefer JWT claims — zero DB when role + is_active are in app_metadata
  let role = user.app_metadata?.role as Role | undefined
  let isActive =
    typeof user.app_metadata?.is_active === 'boolean'
      ? (user.app_metadata.is_active as boolean)
      : user.app_metadata?.is_active === undefined
        ? undefined
        : user.app_metadata?.is_active === true || user.app_metadata?.is_active === 'true'

  // Fallback only when claims missing (legacy sessions before claims backfill)
  if (role === undefined || isActive === undefined) {
    try {
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (profileFetchError) {
        console.error('Middleware profile fetch failed:', profileFetchError)
        return supabaseResponse
      }

      role = profile?.role as Role | undefined
      isActive = profile?.is_active ?? true
    } catch (e) {
      console.error('Middleware profile fetch threw:', e)
      return supabaseResponse
    }
  }

  if (isActive === false) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Account Suspended')
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  const defaultRedirect =
    role && ROLE_REDIRECTS[role] ? ROLE_REDIRECTS[role] : '/projects'

  const skipRoleRedirect =
    path.startsWith('/api/') ||
    path.startsWith('/invoices/') ||
    path.startsWith('/receipts/') ||
    path.startsWith('/hire/')

  if (!skipRoleRedirect && (isAuthPage || path === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = defaultRedirect
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  let isAllowed = true
  for (const [prefix, allowedRoles] of SORTED_PATH_PERMISSIONS) {
    if (path.startsWith(prefix)) {
      if (!allowedRoles.includes(role as Role)) isAllowed = false
      break
    }
  }

  if (!isAllowed) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  return supabaseResponse
}
