const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReports() {
  const { data, error } = await supabase
    .from('eod_reports')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching reports:', error);
  } else {
    console.log('Reports:', data.map(r => ({ id: r.id, date: r.date, user_id: r.user_id })));
  }
}

checkReports();
