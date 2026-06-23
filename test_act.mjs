import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgbhzyphxbjrkkjprqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: project } = await supabase.from('projects').select('id').limit(1).single();
  const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();

  const act = {
    id: "act-test-" + Date.now(),
    project_id: project.id,
    user_id: profile.id,
    action: "FIELD_VISIT_SCHEDULED",
    details: { visit_id: "test", price: 0 },
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from('activity_logs').insert(act);
  console.log("Activity Insert Error:", error);
}

test();
