const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function fixMissing() {
  const { data: eods } = await supabase.from('eod_reports').select('*').eq('date', '2026-07-16');
  
  for (const eod of eods) {
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', eod.user_id)
      .eq('date', eod.date)
      .maybeSingle();

    if (!existing) {
      console.log(`Inserting log for ${eod.user_id}`);
      let status = 'present';
      let signalType = 'eod_submission';
      let notes = 'Submitted via EOD form';

      if (eod.tasks_completed.toLowerCase().includes('field photo') || eod.tasks_completed.toLowerCase().includes('field')) {
         status = 'field_assignment';
         notes = 'Submitted via EOD form as Field assignment';
      }

      const { error } = await supabase
        .from('attendance_logs')
        .insert({
          employee_id: eod.user_id,
          date: eod.date,
          status,
          signal_type: signalType,
          finalized: false,
          notes,
          locked_payroll_cycle_id: null
        });
      
      if (error) console.error(error);
    }
  }
  console.log('Done');
}
fixMissing();
