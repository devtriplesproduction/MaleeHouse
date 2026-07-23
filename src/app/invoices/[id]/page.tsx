import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCompanySettingsAction } from '@/actions/settings.actions';
import { ClientInvoiceViewer } from './ClientInvoiceViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice | Malee House',
  description: 'View your invoice',
};

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, project_id, invoice_number, amount, gst_rate, gst_amount, total_amount, status, milestone_id, visit_id, due_date, notes, created_by, bank_id, created_at, updated_at, projects(name, client_name, budget, payments(amount, status), quotations(total_amount, status)), payments(amount, status)')
    .eq('id', params.id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const companySettings = await getCompanySettingsAction();

  return (
    <ClientInvoiceViewer 
      invoice={invoice} 
      companySettings={companySettings} 
    />
  );
}
