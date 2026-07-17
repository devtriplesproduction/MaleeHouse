import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: intakeProjects, error } = await supabase
    .from('projects')
    .select('id, name, created_by, creator:profiles!projects_created_by_fkey(*)')
    .in('status', ['quotation_requested', 'lead_created'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
    
  console.log("Error:", error);
  console.log("Projects:", JSON.stringify(intakeProjects, null, 2));
}

test();
