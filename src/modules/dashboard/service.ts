import prisma from '@/lib/prisma';
import { DocStatus } from '@prisma/client';
import { DashboardKPIs } from '@/types';
import { ProductService } from '../products/service';
import { LedgerService } from '../ledger/service';
import { WarehouseService } from '../warehouses/service';

export class DashboardService {
  static async getKPIs(): Promise<DashboardKPIs> {
    const products = await ProductService.getAllProducts();
    const warehouses = await WarehouseService.getAllWarehouses();
    const recentLedgerEntries = await LedgerService.getHistory({ limit: 10 });

    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.isLowStock).length;
    const totalInventoryUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalInventoryValuation = products.reduce((acc, p) => acc + p.stockValue, 0);

    const pendingReceiptsCount = await prisma.receipt.count({
      where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
    });

    const pendingDeliveriesCount = await prisma.deliveryOrder.count({
      where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
    });

    const activeTransfersCount = await prisma.internalTransfer.count({
      where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
    });

    const catMap = new Map<string, { count: number; value: number }>();
    for (const p of products) {
      const catName = p.category.name;
      const cur = catMap.get(catName) || { count: 0, value: 0 };
      catMap.set(catName, {
        count: cur.count + 1,
        value: cur.value + p.stockValue,
      });
    }

    const stockByCategory = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      count: val.count,
      value: val.value,
    }));

    const warehouseCapacities = warehouses.map((wh) => ({
      warehouse: wh.name,
      units: wh.totalUnits,
      locationCount: wh.locationCount,
    }));

    return {
      totalProducts,
      lowStockCount,
      totalInventoryUnits,
      totalInventoryValuation,
      pendingReceiptsCount,
      pendingDeliveriesCount,
      activeTransfersCount,
      recentLedgerEntries,
      stockByCategory,
      warehouseCapacities,
    };
  }
}
