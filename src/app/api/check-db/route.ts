import { NextResponse } from 'next/server';
import { createQuotationAction } from '@/actions/quotation.actions';

export async function POST(req: Request) {
  const payload = await req.json();
  const res = await createQuotationAction(payload);
  return NextResponse.json(res);
}
