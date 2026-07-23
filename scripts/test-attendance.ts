import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('attendance_logs').select('id, employee_id, date, status, check_in_time, check_out_time, created_at');
  console.log("Attendance Logs:", data?.length, error);
  if (data && data.length > 0) {
    console.log(data.slice(0, 5));
  }
}
main();
