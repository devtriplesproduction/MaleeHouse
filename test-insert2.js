const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(l => { const [k,v] = l.split('='); if(k && v) process.env[k.trim()] = v.trim(); });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // mock profile and project
  const projectId = 'PRJ-2606-079'; // wiro project
  const profileId = 'd7bd0ddd-fd9c-4d8b-9faa-10c5464cc6db'; // field worker

  const { data: admins, error: adminErr } = await supabase.from('profiles').select('id').in('role', ['admin', 'engineer']);
  console.log("Admins:", admins, "Err:", adminErr);

  for (const admin of (admins || [])) {
    console.log("Inserting notification for admin:", admin.id);
    const { error } = await supabase.from('notifications').insert({
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: admin.id,
      title: "📦 New Material Request",
      message: `Test Worker requested 10x Cement for "wiro".`,
      type: "assignment",
      is_read: false,
      related_project_id: projectId,
      created_at: new Date().toISOString()
    });
    console.log("Insert result:", error);
  }
}
run();
