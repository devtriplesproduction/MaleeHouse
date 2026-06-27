require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
  const adminId = admins[0].id;
  console.log("Admin ID:", adminId);

  const { error } = await supabase.from('notifications').insert({
    id: `ntf-${Date.now()}`,
    user_id: adminId,
    title: "📦 New Material Request",
    message: `Test Request`,
    type: "assignment",
    is_read: false,
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert succeeded!");
  }
}
run();
