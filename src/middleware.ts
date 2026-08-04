import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimitAsync } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  const path = request.nextUrl.pathname
  const method = request.method
  const isProd = process.env.NODE_ENV === 'production'

  // Health always public (load balancers) — handled without session work below
  // Block debug / probe API routes in production
  if (
    isProd &&
    (path.startsWith('/api/test') ||
      path.startsWith('/api/benchmark') ||
      path.startsWith('/api/check-db') ||
      path.startsWith('/api/check-reports') ||
      path.startsWith('/api/seed'))
  ) {
    return new NextResponse(null, { status: 404 })
  }

  // Login brute-force (only POSTs — Server Actions hit the page URL)
  if (path === '/login' && method === 'POST') {
    const limit = isProd ? 5 : 100
    const allowed = await checkRateLimitAsync(`${ip}-login`, limit, 60_000)
    if (!allowed) {
      return new NextResponse('Too many login attempts. Please try again later.', {
        status: 429,
      })
    }
  }

  // Password-change surface
  if (path === '/profile' && method === 'POST') {
    const allowed = await checkRateLimitAsync(`${ip}-password-change`, 5, 60_000)
    if (!allowed) {
      return new NextResponse('Too many password change attempts. Please try again later.', {
        status: 429,
      })
    }
  }

  // Client portal: rate-limit all methods (token enumeration)
  if (path.startsWith('/client-portal/')) {
    const allowed = await checkRateLimitAsync(`${ip}-client-portal`, 20, 60_000)
    if (!allowed) {
      return new NextResponse('Rate limit exceeded. Please try again later.', { status: 429 })
    }
  }

  // Public finance pages: lighter limit, skip rate-limit RPC for HEAD
  if (
    method !== 'HEAD' &&
    (path.startsWith('/invoices/') || path.startsWith('/receipts/'))
  ) {
    const allowed = await checkRateLimitAsync(`${ip}-public-finance`, 60, 60_000)
    if (!allowed) {
      return new NextResponse('Rate limit exceeded. Please try again later.', { status: 429 })
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Skip static assets, images, fonts — no Auth gateway cost.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|eot)$).*)',
  ],
}
