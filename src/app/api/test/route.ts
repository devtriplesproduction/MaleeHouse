import { NextResponse } from 'next/server';
import { getProfitLossReportAction } from '@/actions/reports.actions';

export async function GET() {
  const res = await getProfitLossReportAction('2026-06-01', '2026-06-30');
  return NextResponse.json({ result: res });
}
