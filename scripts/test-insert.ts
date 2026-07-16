import { createAdminClient } from '@/lib/supabase/admin'

export async function checkError() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('attendance_logs').insert({
    employee_id: '9098c393-f07d-482d-94c2-3975de2d8545',
    date: '2026-07-16',
    status: 'present',
    signal_type: 'admin_override',
    finalized: false
  } as any);
  console.log(error);
}
checkError();
