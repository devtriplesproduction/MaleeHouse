
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from("projects").select("id, name, status, created_at").ilike("name", "%wipro%");
  console.log("Projects:", data);
  if (data && data.length > 0) {
    for (const p of data) {
      const { data: assignments } = await supabase.from("project_assignments").select("*").eq("project_id", p.id);
      console.log(`Assignments for ${p.id}:`, assignments);
    }
  }
}
check();

