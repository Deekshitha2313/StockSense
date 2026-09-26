import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const receipt = await ReceiptService.getReceiptById(params.id);
    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
