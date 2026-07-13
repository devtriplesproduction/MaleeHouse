const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('e:/Triple S Production/MaleeHouse-main/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').map(line => line.split('=')));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name');
    
  if (userError) {
    console.error('User Error:', userError);
    return;
  }
  
  const yash = users.find(u => u.first_name === 'Yash');
  console.log('Yash Profile:', yash);
  
  const { data: eods, error: eodError } = await supabase
    .from('eod_reports')
    .select('id, user_id, date, status')
    .eq('user_id', yash?.id);
    
  if (eodError) {
    console.error('EOD Error:', eodError);
    return;
  }
  
  console.log('Yash EODs:', eods);
}

run();
