import { cookies } from 'next/headers';
import { AuthService } from './service';
import { UserSession } from '@/types';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE_NAME = 'stocksense_session';

export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return AuthService.verifyToken(token);
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireManager(): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== 'MANAGER') {
    redirect('/');
  }
  return session;
}
