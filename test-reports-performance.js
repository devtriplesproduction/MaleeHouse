require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qdgvxqbdtbnjtxykjgul.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3Z4cWJkdGJuanR4eWtqZ3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk1MzQ3OCwiZXhwIjoyMTAwNTI5NDc4fQ.W-Z5e-xUFmqRL7vxp_IHGBtmxXQN_nplZb20TnRUWUQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPerformanceTest() {
  console.log("Measuring get_financial_summary_report performance...");
  
  const startTimer = performance.now();
  const { data, error } = await supabase.rpc('get_financial_summary_report', { 
    start_date: '2020-01-01', 
    end_date: '2030-01-01' 
  });
  const endTimer = performance.now();
  
  if (error) {
    console.error("RPC Error:", error.message);
  } else {
    console.log(`RPC Execution Time: ${(endTimer - startTimer).toFixed(2)} ms`);
    console.log(`Rows returned: ${data?.length || 0}`);
  }
  
  console.log("\nMeasuring get_revenue_by_project performance...");
  const startTimer2 = performance.now();
  const { data: revData, error: revError } = await supabase.rpc('get_revenue_by_project', { 
    p_start_date: '2020-01-01', 
    p_end_date: '2030-01-01',
    p_project_id: null
  });
  const endTimer2 = performance.now();
  
  if (revError) {
    console.error("RPC Error (get_revenue_by_project):", revError.message);
  } else {
    console.log(`RPC Execution Time: ${(endTimer2 - startTimer2).toFixed(2)} ms`);
    console.log(`Rows returned: ${revData?.length || 0}`);
  }
}

runPerformanceTest();
