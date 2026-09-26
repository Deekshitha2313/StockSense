import { NextResponse } from 'next/server';
import { LedgerService } from '@/modules/ledger/service';
import { DocType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const docType = (searchParams.get('docType') as DocType) || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const history = await LedgerService.getHistory({
      productId,
      locationId,
      warehouseId,
      docType,
      search,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch ledger audit history';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
