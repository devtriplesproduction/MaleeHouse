import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ error: 'Debug route disabled' }, { status: 403 });
}

export async function GET() {
  return POST();
}
