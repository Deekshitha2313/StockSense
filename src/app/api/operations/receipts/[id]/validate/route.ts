import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';
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

    const updated = await ReceiptService.validateReceipt(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Receipt "${updated.receiptNumber}" successfully validated. Stock has been credited to the ledger.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to validate receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
