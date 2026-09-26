import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';
import { getServerSession } from '@/modules/auth/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await AdjustmentService.applyAdjustment(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Stock adjustment "${updated.adjustmentNumber}" applied. Variance logged to ledger.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to apply adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
