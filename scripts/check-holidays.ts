import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function checkHolidays() {
  const { data, error } = await supabase.from('holidays').select('*');
  console.log(JSON.stringify(data, null, 2));
}

checkHolidays();
