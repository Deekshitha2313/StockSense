import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();
    const result = await AuthService.resetPasswordWithOtp(email, otp, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Password reset failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
