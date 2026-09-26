import { NextResponse } from 'next/server';
import { WarehouseService } from '@/modules/warehouses/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET() {
  try {
    const warehouses = await WarehouseService.getAllWarehouses();
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch warehouses';
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
    const warehouse = await WarehouseService.createWarehouse(body);

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create warehouse';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
