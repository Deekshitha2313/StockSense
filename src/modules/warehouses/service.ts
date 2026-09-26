import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WarehouseService {
  static async getAllWarehouses() {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const stockByLocation = await prisma.stockLedger.groupBy({
      by: ['locationId'],
      _sum: {
        quantityDelta: true,
      },
    });

    const locationStockMap = new Map<string, number>();
    for (const item of stockByLocation) {
      locationStockMap.set(item.locationId, item._sum.quantityDelta?.toNumber() || 0);
    }

    return warehouses.map((wh) => {
      let totalUnits = 0;
      const locationsWithQty = wh.locations.map((loc) => {
        const qty = locationStockMap.get(loc.id) || 0;
        totalUnits += qty;
        return {
          ...loc,
          currentUnits: qty,
        };
      });

      return {
        ...wh,
        locations: locationsWithQty,
        totalUnits,
        locationCount: wh.locations.length,
      };
    });
  }

  static async getLocations(warehouseId?: string) {
    const where: Prisma.LocationWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.location.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { code: 'asc' }],
    });
  }

  static async createWarehouse(data: { name: string; code: string; address?: string }) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Warehouse name must be at least 2 characters');
    }
    const code = data.code.trim().toUpperCase();
    if (code.length < 2) {
      throw new Error('Warehouse code must be at least 2 characters');
    }

    const existingCode = await prisma.warehouse.findUnique({
      where: { code },
    });
    if (existingCode) {
      throw new Error(`Warehouse code "${code}" already exists`);
    }

    return prisma.warehouse.create({
      data: {
        name: data.name.trim(),
        code,
        address: data.address?.trim(),
      },
    });
  }

  static async createLocation(data: {
    warehouseId: string;
    name: string;
    code: string;
    type?: string;
  }) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Location name must be at least 2 characters');
    }
    const code = data.code.trim().toUpperCase();
    if (code.length < 2) {
      throw new Error('Location code must be at least 2 characters');
    }

    const existing = await prisma.location.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: data.warehouseId,
          code,
        },
      },
    });

    if (existing) {
      throw new Error(`Location code "${code}" already exists in this warehouse`);
    }

    return prisma.location.create({
      data: {
        warehouseId: data.warehouseId,
        name: data.name.trim(),
        code,
        type: data.type || 'STORAGE',
      },
      include: {
        warehouse: true,
      },
    });
  }
}
