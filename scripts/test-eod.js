const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase.from('eod_reports').select('*').eq('date', '2026-07-16');
  console.log('EOD Reports for 2026-07-16:', data?.length);
  if (data && data.length > 0) {
    console.log(data);
  }
}
run();
