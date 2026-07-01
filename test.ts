import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: proj } = await supabase.from('projects').select('id').limit(1).single();
  const { data, error } = await supabase.from('invoices').insert({
    id: `inv-test-${Date.now()}`,
    project_id: proj?.id,
    invoice_number: `INV-TEST-${Date.now()}`,
    amount: 1000,
    gst_rate: 18,
    gst_amount: 180,
    total_amount: 1180,
    status: 'draft'
  }).select().single();
  
  console.log("Inserted invoice:", data, error);
}
check();
