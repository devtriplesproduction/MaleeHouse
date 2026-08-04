import { notFound } from 'next/navigation'
import { getCompanySettingsAction } from '@/actions/settings.actions'
import { ClientInvoiceViewer } from './ClientInvoiceViewer'
import { fetchPublicInvoice } from '@/lib/public-finance'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invoice | Malee House',
  description: 'View your invoice',
}

export const dynamic = 'force-dynamic'

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { token?: string }
}) {
  // Prefer signed token when present; else public RPC by id (status-filtered)
  const invoice = await fetchPublicInvoice(params.id, searchParams.token)

  if (!invoice) {
    notFound()
  }

  const companySettings = await getCompanySettingsAction()

  return (
    <ClientInvoiceViewer invoice={invoice as any} companySettings={companySettings} />
  )
}
