import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgbhzyphxbjrkkjprqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: project } = await supabase.from('projects').select('id').limit(1).single();
  if (!project) {
    console.log("No projects found!");
    return;
  }

  const newVisit = {
    id: "vst-" + Date.now(),
    project_id: project.id,
    scheduled_date: new Date().toISOString(),
    status: "scheduled",
    purpose: "Testing Field Visit",
    assigned_team: [],
    visit_cost: 0,
    is_billable: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: insertErr } = await supabase.from('project_visits').insert(newVisit);
  console.log("Insert Error:", insertErr);
}

test();
