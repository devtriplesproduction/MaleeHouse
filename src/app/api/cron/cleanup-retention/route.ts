import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // Parse the cron secret from the authorization header or query params
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc('cleanup_retention_data');
    
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Data retention cleanup executed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
