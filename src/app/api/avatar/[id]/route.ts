import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase: any = await createClient();
    
    // Fast, local JWT decode check to enforce auth without hitting the Auth API
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data } = await supabase
      .from('profiles')
      .select('profile_photo')
      .eq('id', params.id)
      .single();

    if (!data?.profile_photo) {
      // 1x1 transparent PNG
      const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const buffer = Buffer.from(transparentPngBase64, 'base64');
      return new NextResponse(buffer, { 
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'private, max-age=86400',
        }
      });
    }

    const photoStr = data.profile_photo;
    
    // Check if it's a base64 data URI
    const match = photoStr.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'private, max-age=86400, stale-while-revalidate=86400',
        },
      });
    }

    // If it's just a regular URL
    return NextResponse.redirect(photoStr);
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
