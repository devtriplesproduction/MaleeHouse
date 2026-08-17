import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  console.log("Generating fake performance metrics...");
  const paths = ['/projects', '/invoices', '/payments', '/projects/[id]', '/dashboard'];
  
  for (let i = 0; i < 20; i++) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    const duration = Math.floor(Math.random() * 1500) + 100;
    
    await supabase.from('performance_metrics').insert({
      path,
      method: 'ACTION',
      duration_ms: duration,
      status_code: 200
    });
  }
  console.log("Done generating performance metrics.");

  console.log("Generating fake error logs...");
  const errors = [
    { message: "Failed to connect to database", module: "Database", severity: "CRITICAL", path: "/projects" },
    { message: "Invalid user input for project creation", module: "Validation", severity: "LOW", path: "/projects/new" },
    { message: "Timeout waiting for third-party API", module: "External API", severity: "HIGH", path: "/invoices/sync" },
    { message: "React Error Boundary: Cannot read properties of undefined", module: "Client/React", severity: "HIGH", path: "/dashboard" },
  ];

  for (const err of errors) {
    await supabase.from('error_logs').insert({
      ...err,
      stack_trace: "Error: " + err.message + "\n    at Object.<anonymous> (/app/test.js:1:1)",
      ip_address: "127.0.0.1",
      user_agent: "Mozilla/5.0 (Test Browser)"
    });
  }
  console.log("Done generating error logs.");
}

run();
