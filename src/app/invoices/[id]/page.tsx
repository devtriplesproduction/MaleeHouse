import { notFound } from 'next/navigation'
import { getCompanySettingsAction } from '@/actions/settings.actions'
import { ClientInvoiceViewer } from './ClientInvoiceViewer'
import { fetchPublicInvoice } from '@/lib/public-finance'
import { requireAuthContext } from '@/lib/permissions/access-control'
import { verifyProjectAccess } from '@/lib/permissions/project-access'
import { createClient } from '@/lib/supabase/server'
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
  // 1. Try resolving via share token or public non-draft RPC
  let invoice = await fetchPublicInvoice(params.id, searchParams.token)

  // 2. If not found via public path, check if an authenticated user is authorized to view this invoice (including draft)
  if (!invoice && params.id) {
    const auth = await requireAuthContext()
    if (!auth.error && auth.userId) {
      try {
        const supabase: any = await createClient()
        // Query invoice header to check existence, status, and project ownership
        const { data: invHeader } = await supabase
          .from('invoices')
          .select('id, project_id, status')
          .eq('id', params.id)
          .maybeSingle()

        if (invHeader && invHeader.status !== 'cancelled') {
          // Verify user has permission to access this project based on existing roles / assignments
          const access = await verifyProjectAccess(
            invHeader.project_id,
            auth.userId,
            auth.role,
            true
          )

          if (access.isAllowed) {
            const { data } = await supabase
              .from('invoices')
              .select(
                '*, projects(name, client_name, client_contact, client_address, budget, gst_number, payments(amount, status), quotations(total_amount, status, gst_rate, client_details)), payments(amount, status), bank_accounts(bank_name, account_name, account_number, ifsc_code)'
              )
              .eq('id', params.id)
              .single()

            if (data) {
              const rawProj: any = data.projects
              invoice = {
                id: data.id,
                invoice_number: data.invoice_number,
                amount: data.amount,
                gst_rate: data.gst_rate,
                gst_amount: data.gst_amount,
                total_amount: data.total_amount,
                status: data.status,
                due_date: data.due_date,
                created_at: data.created_at,
                project_id: data.project_id,
                projects: rawProj
                  ? {
                      name: rawProj.name,
                      client_name: rawProj.client_name,
                      client_contact: rawProj.client_contact,
                      gst_number: rawProj.gst_number,
                      budget: rawProj.budget,
                      site_details: { address: rawProj.client_address },
                      payments: rawProj.payments || [],
                      quotations: rawProj.quotations || [],
                    }
                  : null,
                bank: (data as any).bank_accounts || null,
                payments: (data.payments || []).filter(
                  (p: any) => p.status === 'verified' || p.status === 'paid'
                ),
              }
            }
          }
        }
      } catch (e) {
        console.error('Authenticated invoice authorization check error:', e)
      }
    }
  }

  if (!invoice) {
    notFound()
  }

  const companySettings = await getCompanySettingsAction()

  return (
    <ClientInvoiceViewer invoice={invoice as any} companySettings={companySettings} />
  )
}


