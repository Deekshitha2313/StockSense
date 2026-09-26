import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adjustment = await AdjustmentService.getAdjustmentById(params.id);
    if (!adjustment) {
      return NextResponse.json({ success: false, error: 'Adjustment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: adjustment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
