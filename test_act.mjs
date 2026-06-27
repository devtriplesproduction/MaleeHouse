import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: requests, error: err1 } = await supabase.from('material_requests').select('*');
  console.log('Requests:', requests, err1);

  const { data: notifs, error: err2 } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Latest Notifs:', notifs, err2);
}

main();
