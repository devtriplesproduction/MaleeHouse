require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function unlock() {
  const month = 7;
  const year = 2026;
  
  const { data: cycles } = await supabase.from('payroll_cycles').select('*').eq('month', month).eq('year', year);
  if (cycles.length > 0) {
    const cycleId = cycles[0].id;
    console.log("Unlocking cycle", cycleId);
    
    // Delete snapshots (cascades or manual)
    await supabase.from('payroll_snapshots').delete().eq('cycle_id', cycleId);
    
    // Delete cycle
    await supabase.from('payroll_cycles').delete().eq('id', cycleId);
    
    console.log("Unlocked!");
  } else {
    console.log("Already unlocked.");
  }
}
unlock();
