import React from 'react';
import { requireAuth } from '@/modules/auth/session';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return <DashboardShell user={session}>{children}</DashboardShell>;
}
