import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgbhzyphxbjrkkjprqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const milestoneId = "ms-1781545892308-0-s3zt";
  const newDueDate = "2026-06-25";
  const reason = "testing 123";
  
  const { data: milestone, error: fetchErr } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .single();

  console.log("Fetch Error:", fetchErr);
  if (!milestone) return;

  const { error: updateErr } = await supabase
    .from('project_milestones')
    .update({
      due_date: newDueDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId);

  console.log("Update Error:", updateErr);

  const { error: logErr } = await supabase.from('activity_logs').insert({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    project_id: milestone.project_id,
    user_id: null,
    action: 'MILESTONE_RESCHEDULED',
    details: { milestone_id: milestoneId, new_due_date: newDueDate, reason }
  });

  console.log("Activity Log Error:", logErr);
}

test();
