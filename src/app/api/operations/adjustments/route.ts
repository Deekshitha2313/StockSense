import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const adjustments = await AdjustmentService.getAllAdjustments({ status, search });
    return NextResponse.json({ success: true, data: adjustments });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch adjustments';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const adjustment = await AdjustmentService.createAdjustment(body, session.id);

    return NextResponse.json({
      success: true,
      data: adjustment,
      message: `Stock adjustment "${adjustment.adjustmentNumber}" recorded`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to record adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
