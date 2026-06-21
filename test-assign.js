import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://ewgbhzyphxbjrkkjprqy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg')

async function test() {
  const { data: existing, error: selErr } = await supabase
    .from('project_assignments')
    .select('id')
    .eq('project_id', 'PRJ-2606-009')
    .eq('user_id', '4a9108b9-37ec-4723-90d7-88f7e5682719')
    .maybeSingle()

  console.log('existing:', existing, 'selErr:', selErr)

  if (existing) {
    const { data, error } = await supabase
      .from('project_assignments')
      .update({ role: 'engineer', assigned_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
    console.log('update result:', data, 'error:', error)
  }
}

test()
