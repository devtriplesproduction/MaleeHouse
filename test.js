import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

Promise.all([
  supabase.from('projects').select('*'),
  supabase.from('invoices').select('*'),
  supabase.from('quotations').select('*'),
  supabase.from('project_visits').select('*')
]).then(([projectsRes, invoicesRes, quotationsRes, visitsRes]) => {
  const projects = projectsRes.data || [];
  const invoices = invoicesRes.data || [];
  const quotations = quotationsRes.data || [];
  const visits = visitsRes.data || [];
  
  projects.forEach(p => {
    const pQuotations = quotations.filter(q => q.project_id === p.id && q.status === 'Approved');
    const qTotal = pQuotations.reduce((s, q) => s + Number(q.total_amount || 0), 0);
    const pVisits = visits.filter(v => v.project_id === p.id && v.is_billable);
    const vTotal = pVisits.reduce((s, v) => s + Number(v.visit_cost || 0), 0);
    const tBilled = qTotal + vTotal;
    
    const pInvoices = invoices.filter(i => i.project_id === p.id && i.status === 'paid');
    const tPaid = pInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    
    const outstanding = tBilled - tPaid;
    if(outstanding > 0 || tBilled > 0) {
      console.log(`Project: ${p.name}, Billed: ${tBilled}, Paid: ${tPaid}, Outstanding: ${outstanding}`);
    }
  });
});
