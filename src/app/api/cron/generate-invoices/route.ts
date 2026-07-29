import { NextResponse } from 'next/server';
import { autoGenerateMilestoneInvoicesAction } from '@/actions/finance.actions';

export async function GET(request: Request) {
  // Parse the cron secret from the authorization header or query params
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret') || request.headers.get('Authorization')?.replace('Bearer ', '');

  try {
    const response = await autoGenerateMilestoneInvoicesAction(cronSecret || undefined);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone invoice generation cron executed successfully.',
      details: response.data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
