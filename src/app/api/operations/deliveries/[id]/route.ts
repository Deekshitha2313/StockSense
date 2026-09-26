import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const delivery = await DeliveryService.getDeliveryById(params.id);
    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: delivery });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
