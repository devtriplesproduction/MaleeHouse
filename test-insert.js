import { createClient } from '@supabase/supabase-js';

const url = 'https://qdgvxqbdtbnjtxykjgul.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3Z4cWJkdGJuanR4eWtqZ3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk1MzQ3OCwiZXhwIjoyMTAwNTI5NDc4fQ.W-Z5e-xUFmqRL7vxp_IHGBtmxXQN_nplZb20TnRUWUQ'; // Service role key from .env.local

const supabase = createClient(url, key);

async function testInsert() {
  const { data, error } = await supabase.from('workflow_history').insert({
    project_id: '00000000-0000-0000-0000-000000000000',
    changed_by: '00000000-0000-0000-0000-000000000000',
    comment: 'Test insert'
  });
  console.log('Result:', { data, error });
}

testInsert();
