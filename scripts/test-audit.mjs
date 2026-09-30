import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabaseAdmin.from('audit_logs').select('*');
  console.log('Error:', error);
  console.log('Data count:', data?.length);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
