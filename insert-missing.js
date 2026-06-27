const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(l => { const [k,v] = l.split('='); if(k && v) process.env[k.trim()] = v.trim(); });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // admin
  const adminId = '4c5d922c-b909-42cc-b999-301fe80c6075';

  const requests = [
    { item: 'sss', qty: 1, proj: 'wiro' },
    { item: 'metal rod', qty: 2, proj: 'wiro' },
    { item: 'measurring instruments', qty: 1, proj: 'Pune IT Park Layout Survey' }
  ];

  for (const r of requests) {
    const { error } = await supabase.from('notifications').insert({
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: adminId,
      title: "📦 New Material Request",
      message: `Vicky Pawar requested ${r.qty}x ${r.item} for "${r.proj}".`,
      type: "assignment",
      is_read: false,
      created_at: new Date().toISOString()
    });
    console.log("Inserted:", r.item, error);
  }
}
run();
