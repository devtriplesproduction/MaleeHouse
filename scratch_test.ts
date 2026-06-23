import { createClient } from './src/lib/supabase/server';

async function testQuery() {
  const supabase = await createClient();
  const { data: quotes, error: qErr } = await supabase.from('quotations').select('project_id, total_amount, status');
  const { data: payments, error: pErr } = await supabase.from('payments').select('project_id, amount, status');
  console.log("Quotes:", quotes);
  console.log("Payments:", payments);
  console.log("Quote Err:", qErr);
  console.log("Payment Err:", pErr);
}

testQuery();
