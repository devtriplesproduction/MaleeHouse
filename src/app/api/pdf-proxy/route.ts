import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(`Failed to fetch from remote URL: ${res.statusText}`, { status: res.status });
    }
    
    const blob = await res.blob();
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        // Strip any Content-Security-Policy or X-Frame-Options headers
      },
    });
  } catch (err) {
    console.error('PDF Proxy error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
