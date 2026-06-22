import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgbhzyphxbjrkkjprqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const profile = users[0];
  
  const today = new Date().toISOString().split('T')[0];
  
  // Delete the test report I created earlier
  await supabase.from('eod_reports').delete().eq('user_id', profile.id).eq('date', today);
  
  // Also delete using report_date just in case
  try {
     await supabase.from('eod_reports').delete().eq('user_id', profile.id).eq('report_date', today);
  } catch(e) {}
  
  console.log("Deleted test reports for today:", today);
}

test();
