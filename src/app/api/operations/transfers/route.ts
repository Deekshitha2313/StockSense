import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const transfers = await TransferService.getAllTransfers({ status, search });
    return NextResponse.json({ success: true, data: transfers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transfers';
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
    const transfer = await TransferService.createTransfer(body, session.id);

    return NextResponse.json({
      success: true,
      data: transfer,
      message: `Internal transfer "${transfer.transferNumber}" created successfully`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
