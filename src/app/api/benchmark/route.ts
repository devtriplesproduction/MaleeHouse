import { NextResponse } from 'next/server';

/** Dev-only probe — disabled in production. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ error: 'Enable locally only. Use load tests outside prod.' }, { status: 403 });
}
