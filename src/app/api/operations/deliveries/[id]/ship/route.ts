import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';
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

    const updated = await DeliveryService.shipDelivery(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Delivery order "${updated.deliveryNumber}" successfully shipped. Stock has been deducted from the ledger.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to dispatch delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
