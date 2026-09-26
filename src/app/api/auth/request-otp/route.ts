import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const result = await AuthService.requestOtp(email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      otp: result.otp,
      message: 'OTP has been generated and sent (see simulated preview)',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'OTP request failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
