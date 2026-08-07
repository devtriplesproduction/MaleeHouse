import { NextResponse } from 'next/server';
import { getProjectQuotationsAction, createQuotationAction } from '@/actions/quotation.actions';
import { performance } from 'perf_hooks';

// This is a temporary route to measure backend performance of the optimized actions
export async function GET() {
  const metrics: any = {};
  
  // 1. Measure getProjectQuotationsAction payload size and time
  const t0 = performance.now();
  const getRes = await getProjectQuotationsAction('PRJ-MH-112');
  const t1 = performance.now();
  
  if (getRes.success) {
    const payloadStr = JSON.stringify(getRes.data);
    metrics.getProjectQuotations = {
      status: 'Success',
      count: getRes.data?.length || 0,
      sizeKB: (Buffer.byteLength(payloadStr, 'utf8') / 1024).toFixed(2),
      timeMs: (t1 - t0).toFixed(2),
      hasEmbeddedProject: (getRes.data && getRes.data.length > 0) ? !!getRes.data[0].project : false
    };
  } else {
    metrics.getProjectQuotations = { status: 'Error', error: getRes.error };
  }

  // 2. Measure createQuotationAction timing
  const createPayload: any = {
    project_id: 'PRJ-MH-112',
    items: [{ description: 'Test Item', amount: 1000 }],
    subtotal: 1000,
    gst_rate: 18,
    gst_amount: 180,
    total_amount: 1180,
    notes: 'Performance test',
    terms: 'Test terms',
    clauses: []
  };

  const t2 = performance.now();
  const createRes = await createQuotationAction(createPayload);
  const t3 = performance.now();

  if (createRes.success) {
    metrics.createQuotation = {
      status: 'Success',
      timeMs: (t3 - t2).toFixed(2)
    };
  } else {
    metrics.createQuotation = { status: 'Error', error: createRes.error };
  }

  return NextResponse.json(metrics);
}
