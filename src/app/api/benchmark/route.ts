import { NextResponse } from 'next/server';
import { getGlobalStatsAction, getAccountantStatsAction, getSalesStatsAction } from '@/actions/stats.actions';
import { getInvoicesAction } from '@/actions/finance.actions';
import { getAllQuotationsAction } from '@/actions/quotation.actions';

export async function GET() {
  const results: any[] = [];
  
  async function measure(name: string, fn: () => Promise<any>) {
    const start = performance.now();
    try {
      await fn();
      const end = performance.now();
      results.push({ API: name, 'Total Time (ms)': parseFloat((end - start).toFixed(2)), Status: 'Success' });
    } catch (e: any) {
      const end = performance.now();
      results.push({ API: name, 'Total Time (ms)': parseFloat((end - start).toFixed(2)), Status: 'Error: ' + e.message });
    }
  }

  await measure('getGlobalStatsAction', getGlobalStatsAction);
  await measure('getAccountantStatsAction', getAccountantStatsAction);
  await measure('getSalesStatsAction', getSalesStatsAction);
  await measure('getInvoicesAction', getInvoicesAction);
  await measure('getAllQuotationsAction', getAllQuotationsAction);

  return NextResponse.json(results);
}
