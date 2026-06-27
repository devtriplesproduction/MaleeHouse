import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase: any = createAdminClient();
    
    // Get the admin user
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
    const adminId = admins?.[0]?.id;
    
    if (!adminId) {
      return NextResponse.json({ error: 'No admin found' });
    }

    // Insert notification
    const { error } = await supabase.from('notifications').insert({
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: adminId,
      title: '📦 New Material Request',
      message: 'Test User requested 10x Cement for "Test Project".',
      type: 'assignment',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Test notification inserted for admin ' + adminId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
