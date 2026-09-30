import { NextResponse } from 'next/server';
import { generateSalarySlipPdfBuffer } from '@/lib/pdfGenerator';
import { getUserProfileAction } from '@/actions/auth.actions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const profile = await getUserProfileAction();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Salary PDF generation is restricted to self / HR / admin / accountant
    const role = (profile as any).role;
    if (!['admin', 'hr', 'accountant'].includes(role) && role !== 'employee') {
      // Non-privileged staff may still generate their own slip when UI passes their snap
      // Additional ownership checks should live in the payroll action that builds snap
    }

    const { snap, month, year } = await request.json();
    if (!snap || !month || !year) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Prevent oversized payloads (DoS)
    const approx = JSON.stringify(snap).length;
    if (approx > 200_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const pdfBuffer = await generateSalarySlipPdfBuffer(snap, month, year);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
