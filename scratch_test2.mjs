import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data: quotes, error: qErr } = await supabase.from('quotations').select('project_id, total_amount, status');
  const { data: payments, error: pErr } = await supabase.from('payments').select('project_id, amount, status');
  console.log("Quotes:", quotes?.slice(0, 5));
  console.log("Payments:", payments?.slice(0, 5));
  console.log("Quote Err:", qErr);
  console.log("Payment Err:", pErr);
}

testQuery();
