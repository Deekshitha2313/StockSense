import React from 'react';
import { DocStatus, DocType } from '@prisma/client';
import { getStatusBadge, getDocTypeBadge } from '@/lib/formatters';

export function StatusBadge({ status }: { status: DocStatus }) {
  const badge = getStatusBadge(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
}

export function DocTypeBadge({ type }: { type: DocType }) {
  const badge = getDocTypeBadge(type);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.bg}`}
    >
      {badge.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: 'MANAGER' | 'STAFF' }) {
  const isManager = role === 'MANAGER';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${
        isManager
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      }`}
    >
      {role}
    </span>
  );
}
