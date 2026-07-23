import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCompanySettingsAction } from '@/actions/settings.actions';
import { ClientReceiptViewer } from './ClientReceiptViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Receipt | Malee House',
  description: 'View your payment receipt',
};

export default async function ReceiptPage({ params, searchParams }: { params: { id: string }, searchParams: { type?: string } }) {
  const supabase = await createClient();
  const type = searchParams.type || 'milestone'; // Default to milestone if not provided
  let receiptData = null;

  let searchId = params.id;
  let queryType = type;

  // Handle legacy URLs like REC-MS-1783339058887 or REC-INV-12345
  if (params.id.startsWith('REC-MS-')) {
    searchId = params.id.replace('REC-MS-', '');
    queryType = 'milestone';
  } else if (params.id.startsWith('REC-INV-')) {
    searchId = params.id.replace('REC-INV-', '');
    queryType = 'invoice';
  }

  if (queryType === 'milestone') {
    // Search exact ID first, fallback to partial match for legacy URLs
    let { data, error } = await supabase
      .from('milestones')
      .select('id, amount, project_id, status, created_at, receipt_number, date, payment_method, client_name, projects(id, name, client_name, gst_number)')
      .eq('id', params.id)
      .maybeSingle();

    if (!data && searchId !== params.id) {
       // Legacy fallback
       const fallbackRes = await supabase
         .from('milestones')
         .select('id, amount, project_id, status, created_at, receipt_number, date, payment_method, client_name, projects(id, name, client_name, gst_number)')
         .ilike('id', `%${searchId}%`)
         .limit(1)
         .maybeSingle();
       
       data = fallbackRes.data;
       error = fallbackRes.error;
    }

    if (error || !data) {
      notFound();
    }
    
    const milestone = data as any;

    const cleanId = milestone.id.includes('-') ? milestone.id.split('-')[1].toUpperCase() : milestone.id.substring(0, 5).toUpperCase();

    receiptData = {
      id: `REC-MS-${cleanId}`,
      type: 'milestone' as const,
      projectName: milestone.projects?.name || 'Standalone Assignment',
      clientName: milestone.projects?.client_name || 'Direct Client',
      title: milestone.title,
      amount: milestone.amount,
      dateCleared: milestone.updated_at || milestone.created_at,
      originalId: milestone.id,
      projectId: milestone.project_id,
      clientGstNumber: milestone.projects?.gst_number
    };
  } else if (queryType === 'invoice') {
    let { data, error } = await supabase
      .from('invoices')
      .select('id, project_id, invoice_number, amount, gst_rate, gst_amount, total_amount, status, milestone_id, visit_id, due_date, notes, created_by, bank_id, created_at, updated_at, projects(name, client_name, id, gst_number)')
      .eq('id', params.id)
      .maybeSingle();

    if (!data && searchId !== params.id) {
       // Legacy fallback: invoice numbers might just be numeric or have INV-
       const fallbackRes = await supabase
         .from('invoices')
         .select('id, project_id, invoice_number, amount, gst_rate, gst_amount, total_amount, status, milestone_id, visit_id, due_date, notes, created_by, bank_id, created_at, updated_at, projects(name, client_name, id, gst_number)')
         .ilike('invoice_number', `%${searchId}%`)
         .limit(1)
         .maybeSingle();
       
       data = fallbackRes.data;
       error = fallbackRes.error;
    }

    if (error || !data) {
      notFound();
    }
    
    const invoice = data as any;

    const cleanId = invoice.invoice_number.replace(/\D/g, '') || invoice.id.substring(0, 5).toUpperCase();

    receiptData = {
      id: `REC-INV-${cleanId}`,
      type: 'invoice' as const,
      projectName: invoice.projects?.name || 'Standalone Assignment',
      clientName: invoice.projects?.client_name || 'Direct Client',
      title: `Invoice Payout: ${invoice.invoice_number}`,
      amount: invoice.total_amount,
      dateCleared: invoice.created_at, // Use created_at or updated_at for invoices too
      originalId: invoice.id,
      projectId: invoice.projects?.id,
      clientGstNumber: invoice.projects?.gst_number
    };
  } else {
    notFound();
  }

  const companySettings = await getCompanySettingsAction();

  return (
    <ClientReceiptViewer 
      receipt={receiptData} 
      companySettings={companySettings} 
    />
  );
}
