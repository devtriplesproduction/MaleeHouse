import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ewgbhzyphxbjrkkjprqy.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z2JoenlwaHhianJra2pwcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUwMzgyMCwiZXhwIjoyMDk3MDc5ODIwfQ.cCnoz9GjKKEVftglrsCkjAdWzZUjsYJFdxBcs1cA0Xg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function test() {
  const { data: leaves, error: leavesError } = await supabase
      .from('leaves')
      .select('*, profiles:profiles!leaves_user_id_fkey (first_name, last_name, email, role)')
      .order('created_at', { ascending: false })
      
  console.log('Leaves query result:', JSON.stringify(leaves, null, 2))
  console.log('Leaves query error:', leavesError)
}

test()
