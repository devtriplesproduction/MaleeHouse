import { NextResponse } from 'next/server';
import { notifyUpcomingHolidaysAction } from '@/actions/notification.actions';

export async function GET(request: Request) {
  // Parse the cron secret from the authorization header or query params
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret') || request.headers.get('Authorization')?.replace('Bearer ', '');

  try {
    const response = await notifyUpcomingHolidaysAction(cronSecret || undefined);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.message || 'Holiday notification cron executed successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
