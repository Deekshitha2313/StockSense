import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await TransferService.getTransferById(params.id);
    if (!transfer) {
      return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: transfer });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
