import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_REDIRECTS, PATH_PERMISSIONS, Role } from '../permissions/roles'

// [DIAG] Remove this block when bug is resolved.
const DEV = process.env.NODE_ENV === 'development'
function mwLog(tag: string, data?: Record<string, unknown>) {
  if (!DEV) return
  console.log(`[MW ${new Date().toISOString()}] ${tag}`, data ? JSON.stringify(data) : '')
}

export async function updateSession(request: NextRequest) {
  mwLog('REQUEST', { path: request.nextUrl.pathname, method: request.method })
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
          // [DIAG]
          if (DEV && name.includes('auth')) mwLog('COOKIE_SET', { name })
          request.cookies.set({ name, value, ...options })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // [DIAG]
          if (DEV && name.includes('auth')) mwLog('COOKIE_REMOVE', { name })
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
    // [DIAG]
    mwLog('GET_USER', { uid: user?.id ?? null, email: user?.email ?? null, hasUser: !!user })
  } catch (e) {
    mwLog('GET_USER_THREW', { error: String(e) })
    console.error('Middleware getUser failed:', e)
    return supabaseResponse
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute =
    isAuthPage ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/client-portal') ||
    request.nextUrl.pathname.startsWith('/api/cron')

  if (!user && !isPublicRoute) {
    // [DIAG]
    mwLog('NO_USER_REDIRECT_LOGIN', { path: request.nextUrl.pathname })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie: any) =>
      response.cookies.set(cookie.name, cookie.value)
    )
    return response
  }

  if (user) {
    let role = user.app_metadata?.role as Role | undefined
    let isActive = user.app_metadata?.is_active as boolean | undefined

    // [DIAG]
    mwLog('APP_METADATA', { uid: user.id, roleFromMeta: role ?? null, isActiveFromMeta: isActive ?? null })

    if (role === undefined || isActive === undefined) {
      // [DIAG]
      mwLog('DB_PROFILE_FETCH', { uid: user.id, reason: 'app_metadata missing role or is_active' })
      try {
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (profileFetchError) {
          mwLog('DB_PROFILE_FETCH_ERROR', { uid: user.id, error: profileFetchError.message })
          console.error('Middleware profile fetch query failed:', profileFetchError)
          return supabaseResponse
        }

        role = profile?.role as Role | undefined
        isActive = profile?.is_active ?? true
        // [DIAG]
        mwLog('DB_PROFILE_RESULT', { uid: user.id, role, isActive })
      } catch (e) {
        mwLog('DB_PROFILE_THREW', { uid: user.id, error: String(e) })
        console.error('Middleware profile fetch failed:', e)
        return supabaseResponse
      }
    }

    if (!isActive) {
      // [DIAG]
      mwLog('MIDDLEWARE_SIGNOUT', { uid: user.id, reason: 'is_active=false', role })
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Account Suspended')
      const response = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie: any) =>
        response.cookies.set(cookie.name, cookie.value)
      )
      return response
    }

    // [DIAG]
    mwLog('USER_ALLOWED', { uid: user.id, role, isActive, path: request.nextUrl.pathname })

    const defaultRedirect = role && ROLE_REDIRECTS[role] ? ROLE_REDIRECTS[role] : '/projects'

    if (isAuthPage || request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = defaultRedirect
      const response = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie: any) =>
        response.cookies.set(cookie.name, cookie.value)
      )
      return response
    }

    let isAllowed = true
    for (const [path, allowedRoles] of Object.entries(PATH_PERMISSIONS)) {
      if (request.nextUrl.pathname.startsWith(path)) {
        if (!allowedRoles.includes(role as Role)) isAllowed = false
        break
      }
    }

    if (!isAllowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      const response = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie: any) =>
        response.cookies.set(cookie.name, cookie.value)
      )
      return response
    }
  }

  return supabaseResponse
}
