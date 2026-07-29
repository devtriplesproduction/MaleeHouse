
const SUPABASE_URL = 'https://qdgvxqbdtbnjtxykjgul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3Z4cWJkdGJuanR4eWtqZ3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk1MzQ3OCwiZXhwIjoyMTAwNTI5NDc4fQ.W-Z5e-xUFmqRL7vxp_IHGBtmxXQN_nplZb20TnRUWUQ'; // Using service role key for testing

async function measure(name, url, method = 'GET', body = null) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    let data;
    let rowsReturned = 0;
    if (method !== 'HEAD') {
      data = await res.json();
      rowsReturned = Array.isArray(data) ? data.length : 1;
    }
    const end = performance.now();
    
    // Attempt to calculate serialization roughly
    let serializeStart = 0, serializeEnd = 0, jsonStr = "";
    if (data) {
      jsonStr = JSON.stringify(data);
      serializeStart = performance.now();
      JSON.stringify(data);
      serializeEnd = performance.now();
    }
    
    // Check for Server-Timing or other headers
    const headers = {};
    for (let [key, value] of res.headers.entries()) {
      headers[key] = value;
    }

    console.log(JSON.stringify({
      API: name,
      TotalTimeMs: (end - start).toFixed(2),
      SerializationMs: data ? (serializeEnd - serializeStart).toFixed(2) : "0.00",
      PayloadKB: data ? (jsonStr.length / 1024).toFixed(2) : "0.00",
      RowsReturned: rowsReturned,
      Headers: headers,
      Status: res.ok ? 'Success' : 'Error'
    }));
  } catch (e) {
    console.error(JSON.stringify({ API: name, Error: e.message }));
  }
}

async function run() {
  console.log("--- Starting Benchmarks ---");
  
  // 1. getInvoicesAction
  await measure('getInvoicesAction', `${SUPABASE_URL}/rest/v1/invoices?select=*,projects(name,client_name)`);
  
  // 2. getAccountantStatsAction (Sum total_amount)
  await measure('getAccountantStatsAction_SumQuotations', `${SUPABASE_URL}/rest/v1/quotations?select=total_amount&status=eq.Approved`);

  console.log("--- Finished Benchmarks ---");
}

run();
