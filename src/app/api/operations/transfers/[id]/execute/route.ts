import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';
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

    const updated = await TransferService.executeTransfer(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Internal transfer "${updated.transferNumber}" successfully executed with dual ledger updates.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to execute transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
