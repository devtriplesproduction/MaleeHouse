import { NextResponse } from 'next/server';
import { generateSalarySlipPdfBuffer } from '@/lib/pdfGenerator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { snap, month, year } = await request.json();
    const pdfBuffer = await generateSalarySlipPdfBuffer(snap, month, year);
    
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
