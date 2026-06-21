import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_REDIRECTS, PATH_PERMISSIONS, Role } from '../permissions/roles'

export async function updateSession(request: NextRequest) {
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
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (e) {
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

    if (role === undefined || isActive === undefined) {
      try {
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (profileFetchError) {
          console.error('Middleware profile fetch query failed:', profileFetchError)
          return supabaseResponse
        }

        role = profile?.role as Role | undefined
        isActive = profile?.is_active ?? true
      } catch (e) {
        console.error('Middleware profile fetch failed:', e)
        return supabaseResponse
      }
    }

    if (!isActive) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Account Suspended')
      const response = NextResponse.redirect(url)
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

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
