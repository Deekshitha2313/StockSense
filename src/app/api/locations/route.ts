import { NextResponse } from 'next/server';
import { WarehouseService } from '@/modules/warehouses/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const locations = await WarehouseService.getLocations(warehouseId);
    return NextResponse.json({ success: true, data: locations });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch locations';
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
    const location = await WarehouseService.createLocation(body);

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create location';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
