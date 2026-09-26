import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const deliveries = await DeliveryService.getAllDeliveries({ status, search });
    return NextResponse.json({ success: true, data: deliveries });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch delivery orders';
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
    const delivery = await DeliveryService.createDelivery(body, session.id);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: `Delivery order "${delivery.deliveryNumber}" created successfully`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
