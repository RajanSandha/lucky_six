import {NextRequest, NextResponse} from 'next/server';
import {scheduleWinnerSelection} from '@/ai/flows/schedule-winner-selection';
import {getCurrentDateInUTC} from '@/lib/date-utils';
import {revalidatePath} from 'next/cache';

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');

  if (authKey !== process.env.CRON_SECRET) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  try {
    const result = await scheduleWinnerSelection({
      currentTime: getCurrentDateInUTC().toISOString(),
    });

    // Revalidate paths to ensure data is fresh after the scheduler runs
    revalidatePath('/admin/draws');
    revalidatePath('/admin/announcements');
    revalidatePath('/announcements');
    revalidatePath('/draws');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: `Scheduler ran successfully. Processed ${result.processedDraws.length} draws.`,
      processedDraws: result.processedDraws,
    });
  } catch (error: any) {
    console.error('Error running scheduler via cron endpoint:', error);
    return NextResponse.json(
      {success: false, message: `Failed to run scheduler: ${error.message}`},
      {status: 500}
    );
  }
}
