import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function updateHolidays() {
  const { data, error } = await supabase.from('holidays').update({ is_optional: false }).eq('is_optional', true);
  console.log('Update complete:', { data, error });
}

updateHolidays();
