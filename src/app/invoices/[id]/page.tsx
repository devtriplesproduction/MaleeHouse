import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCompanySettingsAction } from '@/actions/settings.actions';
import { ClientInvoiceViewer } from './ClientInvoiceViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice | Malee House',
  description: 'View your invoice',
};

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, projects(name, client_name, budget, payments(amount, status), quotations(total_amount, status)), payments(amount, status)')
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
