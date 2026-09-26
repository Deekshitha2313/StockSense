import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const receipts = await ReceiptService.getAllReceipts({ status, search });
    return NextResponse.json({ success: true, data: receipts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch receipts';
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
    const receipt = await ReceiptService.createReceipt(body, session.id);

    return NextResponse.json({
      success: true,
      data: receipt,
      message: `Receipt "${receipt.receiptNumber}" created successfully`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
