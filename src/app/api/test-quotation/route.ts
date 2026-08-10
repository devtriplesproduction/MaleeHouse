
import { NextResponse } from 'next/server';
import { getQuotationByTokenAction } from '@/actions/quotation.actions';
import { getCompanySettingsAction } from '@/actions/settings.actions';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const token = '29683b75-3dbf-4e68-b555-2d0d47be54f0';

  try {
    if (type === 'quotation') {
      const res = await getQuotationByTokenAction(token);
      return NextResponse.json(res);
    } 
    if (type === 'settings') {
      const res = await getCompanySettingsAction();
      return NextResponse.json(res);
    }
    if (type === 'sequential') {
      const q = await getQuotationByTokenAction(token);
      const s = await getCompanySettingsAction();
      return NextResponse.json({ q, s });
    }
    if (type === 'parallel') {
      const [q, s] = await Promise.all([
        getQuotationByTokenAction(token),
        getCompanySettingsAction()
      ]);
      return NextResponse.json({ q, s });
    }
    return NextResponse.json({ error: 'invalid type' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

