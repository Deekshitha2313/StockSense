const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. src/types/index.ts
writeFile('src/types/index.ts', `import { Role, DocStatus, DocType } from '@prisma/client';

export type { Role, DocStatus, DocType };

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProductWithStock {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  unitOfMeasure: string;
  price: number;
  cost: number;
  minStockThreshold: number;
  currentStock: number;
  isLowStock: boolean;
  stockValue: number;
  locationsBreakdown?: {
    locationId: string;
    locationName: string;
    warehouseName: string;
    quantity: number;
  }[];
}

export interface StockLedgerEntryDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  warehouseName: string;
  quantityDelta: number;
  balanceAfter: number;
  referenceDocType: DocType;
  referenceDocId: string;
  referenceDocNumber: string;
  notes: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface DashboardKPIs {
  totalProducts: number;
  lowStockCount: number;
  totalInventoryUnits: number;
  totalInventoryValuation: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  activeTransfersCount: number;
  recentLedgerEntries: StockLedgerEntryDTO[];
  stockByCategory: { category: string; count: number; value: number }[];
  warehouseCapacities: { warehouse: string; units: number; locationCount: number }[];
}

export interface FilterParams {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  status?: DocStatus;
  docType?: DocType;
  startDate?: string;
  endDate?: string;
  lowStockOnly?: boolean;
}`);

// 2. src/lib/prisma.ts
writeFile('src/lib/prisma.ts', `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;`);

// 3. src/lib/validators.ts
writeFile('src/lib/validators.ts', `export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one digit' };
  }
  return { isValid: true };
}

export function validateSku(sku: string): { isValid: boolean; message?: string } {
  const cleanSku = sku.trim();
  if (cleanSku.length < 3 || cleanSku.length > 30) {
    return { isValid: false, message: 'SKU must be between 3 and 30 characters' };
  }
  if (!/^[A-Z0-9_\\-\\.]+$/i.test(cleanSku)) {
    return { isValid: false, message: 'SKU can only contain alphanumeric characters, hyphens, and underscores' };
  }
  return { isValid: true };
}

export function validateQuantity(qty: number | string, allowZero = false): { isValid: boolean; num: number; message?: string } {
  const num = typeof qty === 'string' ? parseFloat(qty) : qty;
  if (isNaN(num)) {
    return { isValid: false, num: 0, message: 'Quantity must be a valid number' };
  }
  if (!allowZero && num <= 0) {
    return { isValid: false, num, message: 'Quantity must be strictly greater than 0' };
  }
  if (allowZero && num < 0) {
    return { isValid: false, num, message: 'Quantity cannot be negative' };
  }
  return { isValid: true, num };
}

export function validatePrice(price: number | string): { isValid: boolean; num: number; message?: string } {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) {
    return { isValid: false, num: 0, message: 'Price must be a valid number' };
  }
  if (num < 0) {
    return { isValid: false, num, message: 'Price cannot be negative' };
  }
  return { isValid: true, num };
}`);

// 4. src/lib/formatters.ts
writeFile('src/lib/formatters.ts', `import { DocStatus, DocType } from '@prisma/client';

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
}`);

console.log('Done lib & types');
