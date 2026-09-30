import { notFound } from 'next/navigation'
import { getCompanySettingsAction } from '@/actions/settings.actions'
import { ClientReceiptViewer } from './ClientReceiptViewer'
import { fetchPublicReceipt } from '@/lib/public-finance'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Receipt | Malee House',
  description: 'View your payment receipt',
}

export const dynamic = 'force-dynamic'

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { type?: string; token?: string }
}) {
  let searchId = params.id
  let queryType: 'milestone' | 'invoice' =
    searchParams.type === 'milestone' ? 'milestone' : 'invoice'

  if (params.id.startsWith('REC-MS-')) {
    searchId = params.id.replace('REC-MS-', '')
    queryType = 'milestone'
  } else if (params.id.startsWith('REC-INV-')) {
    searchId = params.id.replace('REC-INV-', '')
    queryType = 'invoice'
  }

  const lookupId = params.id.startsWith('REC-') ? searchId : params.id
  const data = await fetchPublicReceipt(lookupId, queryType, searchParams.token)

  if (!data) {
    notFound()
  }

  const row = data as any
  let receiptData

  if (queryType === 'milestone') {
    const cleanId = row.id?.includes?.('-')
      ? row.id.split('-')[1].toUpperCase()
      : String(row.id || '').substring(0, 5).toUpperCase()

    receiptData = {
      id: `REC-MS-${cleanId}`,
      type: 'milestone' as const,
      projectName: row.projects?.name || 'Standalone Assignment',
      clientName: row.projects?.client_name || 'Direct Client',
      title: row.title,
      amount: row.amount,
      dateCleared: row.updated_at || row.created_at,
      originalId: row.id,
      projectId: row.project_id,
      clientGstNumber: row.projects?.gst_number,
    }
  } else {
    const cleanId =
      String(row.invoice_number || '').replace(/\D/g, '') ||
      String(row.id || '').substring(0, 5).toUpperCase()

    receiptData = {
      id: `REC-INV-${cleanId}`,
      type: 'invoice' as const,
      projectName: row.projects?.name || 'Standalone Assignment',
      clientName: row.projects?.client_name || 'Direct Client',
      title: `Invoice Payout: ${row.invoice_number}`,
      amount: row.total_amount,
      dateCleared: row.created_at,
      originalId: row.id,
      projectId: row.projects?.id || row.project_id,
      clientGstNumber: row.projects?.gst_number,
    }
  }

  const companySettings = await getCompanySettingsAction()

  return (
    <ClientReceiptViewer receipt={receiptData} companySettings={companySettings} />
  )
}
