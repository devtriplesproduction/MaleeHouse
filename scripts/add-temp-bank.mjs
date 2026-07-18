import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const tempBank = {
  bank_name: "HDFC Bank",
  account_name: "Operational Account",
  account_number: "50200004321098",
  ifsc_code: "HDFC0001234",
  branch_name: "pune",
  is_default: false
};

async function run() {
  const { data, error } = await supabase.from('bank_accounts').insert([tempBank]);
  if (error) {
    console.error("Error inserting temp bank:", error);
  } else {
    console.log("Successfully inserted temp bank!");
  }
}
run();
