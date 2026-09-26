import prisma from '@/lib/prisma';
import { DocType, Prisma } from '@prisma/client';
import { StockLedgerEntryDTO } from '@/types';

export interface RecordMovementParams {
  productId: string;
  locationId: string;
  quantityDelta: number | Prisma.Decimal;
  referenceDocType: DocType;
  referenceDocId: string;
  referenceDocNumber: string;
  notes?: string;
  createdById: string;
  allowNegativeStock?: boolean;
}

export class LedgerService {
  static async recordMovement(
    params: RecordMovementParams,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;
    const deltaNum = typeof params.quantityDelta === 'number' 
      ? params.quantityDelta 
      : params.quantityDelta.toNumber();

    const aggregate = await client.stockLedger.aggregate({
      where: {
        productId: params.productId,
        locationId: params.locationId,
      },
      _sum: {
        quantityDelta: true,
      },
    });

    const currentBalance = aggregate._sum.quantityDelta 
      ? aggregate._sum.quantityDelta.toNumber() 
      : 0;

    const newBalance = currentBalance + deltaNum;

    if (!params.allowNegativeStock && newBalance < 0) {
      const product = await client.product.findUnique({
        where: { id: params.productId },
        select: { name: true, sku: true },
      });
      const location = await client.location.findUnique({
        where: { id: params.locationId },
        select: { name: true, code: true },
      });
      throw new Error(
        `Insufficient stock for "${product?.name || params.productId}" (${product?.sku || ''}) at "${location?.name || params.locationId}". Available: ${currentBalance}, Requested: ${Math.abs(deltaNum)}`
      );
    }

    return client.stockLedger.create({
      data: {
        productId: params.productId,
        locationId: params.locationId,
        quantityDelta: new Prisma.Decimal(deltaNum),
        balanceAfter: new Prisma.Decimal(newBalance),
        referenceDocType: params.referenceDocType,
        referenceDocId: params.referenceDocId,
        referenceDocNumber: params.referenceDocNumber,
        notes: params.notes,
        createdById: params.createdById,
      },
    });
  }

  static async getLocationStock(productId: string, locationId: string): Promise<number> {
    const aggregate = await prisma.stockLedger.aggregate({
      where: {
        productId,
        locationId,
      },
      _sum: {
        quantityDelta: true,
      },
    });

    return aggregate._sum.quantityDelta ? aggregate._sum.quantityDelta.toNumber() : 0;
  }

  static async getProductStock(productId: string) {
    const locationsWithStock = await prisma.stockLedger.groupBy({
      by: ['locationId'],
      where: { productId },
      _sum: {
        quantityDelta: true,
      },
      having: {
        quantityDelta: {
          _sum: {
            not: 0,
          },
        },
      },
    });

    let totalStock = 0;
    const locationDetails = await prisma.location.findMany({
      where: {
        id: { in: locationsWithStock.map((l) => l.locationId) },
      },
      include: {
        warehouse: true,
      },
    });

    const breakdown = locationsWithStock.map((l) => {
      const qty = l._sum.quantityDelta ? l._sum.quantityDelta.toNumber() : 0;
      totalStock += qty;
      const loc = locationDetails.find((d) => d.id === l.locationId);
      return {
        locationId: l.locationId,
        locationName: loc?.name || 'Unknown Location',
        locationCode: loc?.code || 'LOC',
        warehouseName: loc?.warehouse.name || 'Unknown WH',
        quantity: qty,
      };
    });

    return {
      productId,
      totalStock,
      breakdown,
    };
  }

  static async getHistory(filters: {
    productId?: string;
    locationId?: string;
    warehouseId?: string;
    docType?: DocType;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<StockLedgerEntryDTO[]> {
    const where: Prisma.StockLedgerWhereInput = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    } else if (filters.warehouseId) {
      where.location = { warehouseId: filters.warehouseId };
    }

    if (filters.docType) {
      where.referenceDocType = filters.docType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { referenceDocNumber: { contains: s, mode: 'insensitive' } },
        { product: { name: { contains: s, mode: 'insensitive' } } },
        { product: { sku: { contains: s, mode: 'insensitive' } } },
        { location: { name: { contains: s, mode: 'insensitive' } } },
        { notes: { contains: s, mode: 'insensitive' } },
      ];
    }

    const entries = await prisma.stockLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 200,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            warehouse: { select: { name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return entries.map((e) => ({
      id: e.id,
      productId: e.productId,
      productName: e.product.name,
      productSku: e.product.sku,
      locationId: e.locationId,
      locationName: `${e.location.name} (${e.location.code})`,
      warehouseName: e.location.warehouse.name,
      quantityDelta: e.quantityDelta.toNumber(),
      balanceAfter: e.balanceAfter.toNumber(),
      referenceDocType: e.referenceDocType,
      referenceDocId: e.referenceDocId,
      referenceDocNumber: e.referenceDocNumber,
      notes: e.notes,
      createdById: e.createdById,
      createdByName: e.createdBy.name,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
