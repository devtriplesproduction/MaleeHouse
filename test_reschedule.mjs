import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgbhzyphxbjrkkjprqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: m, error: err1 } = await supabase.from('project_milestones').select('id').limit(1);
  if (!m || m.length === 0) {
    console.log("No milestones found", err1);
    return;
  }
  const milestoneId = m[0].id;
  const newDueDate = "2026-06-25";
  const reason = "xxx";
  
  const { error: updateErr } = await supabase
    .from('project_milestones')
    .update({
      due_date: newDueDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId);

  if (updateErr) {
    console.log("Update Error:", updateErr);
  } else {
    console.log("Update Success for milestone:", milestoneId);
  }
}

test();
