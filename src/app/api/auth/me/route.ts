import { NextResponse } from 'next/server';
import { getServerSession } from '@/modules/auth/session';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve session';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
