import { NextResponse } from 'next/server';
import { DashboardService } from '@/modules/dashboard/service';

export async function GET() {
  try {
    const kpis = await DashboardService.getKPIs();
    return NextResponse.json({ success: true, data: kpis });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
