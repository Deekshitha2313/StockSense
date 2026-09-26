import { NextResponse } from 'next/server';
import { getServerSession } from '@/modules/auth/session';
import { AuthService } from '@/modules/auth/service';
import prisma from '@/lib/prisma';
import { validatePassword } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isMatch = await AuthService.verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      return NextResponse.json({ success: false, error: passCheck.message }, { status: 400 });
    }

    const passwordHash = await AuthService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to change password';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
