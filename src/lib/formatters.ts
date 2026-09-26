import { DocStatus, DocType } from '@prisma/client';

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getStatusBadge(status: DocStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'DONE':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'READY':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'WAITING':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'DRAFT':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
    case 'CANCELED':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export function getDocTypeBadge(type: DocType): { bg: string; text: string; label: string } {
  switch (type) {
    case 'RECEIPT':
      return { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', text: 'text-emerald-300', label: 'Receipt (+)' };
    case 'DELIVERY':
      return { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', text: 'text-rose-300', label: 'Delivery (-)' };
    case 'TRANSFER':
      return { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', text: 'text-cyan-300', label: 'Transfer (⇄)' };
    case 'ADJUSTMENT':
      return { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', text: 'text-purple-300', label: 'Adjustment (Δ)' };
    default:
      return { bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30', text: 'text-slate-300', label: String(type) };
  }
}
