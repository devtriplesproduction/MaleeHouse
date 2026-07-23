import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('eod_reports').select('id, user_id, date, summary, created_at, updated_at');
  return NextResponse.json({ data, error });
}
