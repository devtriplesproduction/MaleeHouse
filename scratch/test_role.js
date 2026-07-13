const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('e:/Triple S Production/MaleeHouse-main/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').map(line => line.split('=')));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_user_role');
  console.log('Role RPC test:', { data, error });
}

run();
