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
    const { error } = await supabase.rpc('generate_system_notification', {
      p_target_user_id: adminId,
      p_title: '📦 New Material Request',
      p_message: 'Test User requested 10x Cement for "Test Project".',
      p_type: 'assignment',
      p_related_project_id: null
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Test notification inserted for admin ' + adminId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
