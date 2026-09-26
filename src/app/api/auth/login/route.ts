import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';
import { SESSION_COOKIE_NAME } from '@/modules/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await AuthService.login(email, password);
    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Logged in successfully',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
