import { Role, DocStatus, DocType } from '@prisma/client';

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
}
