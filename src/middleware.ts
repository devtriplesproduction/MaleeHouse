import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// In-memory store for basic IP rate limiting. 
// Note: In a distributed edge environment like Vercel, this is per-isolate. 
// It provides a good baseline defense against rapid brute-forcing.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function applyRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count++;
  rateLimitMap.set(ip, record);
  return true; // Allowed
}

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  const method = request.method;

  // 1. Strict limit for Login Brute Force (5 attempts per minute per IP, increased for dev)
  if (path === '/login' && method === 'POST') {
    const limit = process.env.NODE_ENV === 'development' ? 100 : 5;
    const isAllowed = applyRateLimit(`${ip}-login`, limit, 60 * 1000);
    if (!isAllowed) {
      return new NextResponse('Too many login attempts. Please try again later.', { status: 429 });
    }
  }

  // 2. Strict limit for Password Changes (5 attempts per minute per IP)
  if (path === '/profile' && method === 'POST') {
    const isAllowed = applyRateLimit(`${ip}-password-change`, 5, 60 * 1000);
    if (!isAllowed) {
      return new NextResponse('Too many password change attempts. Please try again later.', { status: 429 });
    }
  }

  // 3. Moderate limit for Client Portal Token endpoints to prevent enumeration (20 attempts per minute)
  if (path.startsWith('/client-portal/')) {
    // Both GET and POST (GET for initial page load, POST for accept/reject actions)
    const isAllowed = applyRateLimit(`${ip}-client-portal`, 20, 60 * 1000);
    if (!isAllowed) {
      return new NextResponse('Rate limit exceeded. Please try again later.', { status: 429 });
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
