import prisma from '@/lib/prisma';
import { DocStatus, DocType, Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/service';
import { validateQuantity } from '@/lib/validators';

export interface CreateAdjustmentItemInput {
  productId: string;
  locationId: string;
  countedQuantity: number;
}

export interface CreateAdjustmentInput {
  reason: string;
  items: CreateAdjustmentItemInput[];
}

export class AdjustmentService {
  static async generateAdjustmentNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.stockAdjustment.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `ADJ-${dateStr}-${seq}`;
  }

  static async getAllAdjustments(filters?: { status?: DocStatus; search?: string }) {
    const where: Prisma.StockAdjustmentWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { adjustmentNumber: { contains: s, mode: 'insensitive' } },
        { reason: { contains: s, mode: 'insensitive' } },
      ];
    }

    return prisma.stockAdjustment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
            location: { select: { id: true, name: true, code: true, warehouse: true } },
          },
        },
      },
    });
  }

  static async getAdjustmentById(id: string) {
    return prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
            location: { select: { id: true, name: true, code: true, warehouse: true } },
          },
        },
      },
    });
  }

  static async createAdjustment(data: CreateAdjustmentInput, userId: string) {
    if (!data.reason || data.reason.trim().length < 3) {
      throw new Error('Adjustment reason is required (at least 3 characters)');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('Adjustment must contain at least one item');
    }

    const itemsToCreate = [];
    for (const item of data.items) {
      const qVal = validateQuantity(item.countedQuantity, true);
      if (!qVal.isValid) throw new Error(`Product ${item.productId}: ${qVal.message}`);

      const recorded = await LedgerService.getLocationStock(item.productId, item.locationId);
      const variance = qVal.num - recorded;

      itemsToCreate.push({
        productId: item.productId,
        locationId: item.locationId,
        recordedQuantity: new Prisma.Decimal(recorded),
        countedQuantity: new Prisma.Decimal(qVal.num),
        variance: new Prisma.Decimal(variance),
      });
    }

    const adjustmentNumber = await this.generateAdjustmentNumber();

    return prisma.stockAdjustment.create({
      data: {
        adjustmentNumber,
        reason: data.reason.trim(),
        status: DocStatus.READY,
        createdById: userId,
        items: {
          create: itemsToCreate,
        },
      },
      include: { items: true },
    });
  }

  static async applyAdjustment(adjustmentId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findUnique({
        where: { id: adjustmentId },
        include: { items: { include: { product: true, location: true } } },
      });

      if (!adjustment) throw new Error('Stock adjustment record not found');
      if (adjustment.status === DocStatus.DONE) {
        throw new Error('This adjustment has already been applied');
      }

      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: DocStatus.DONE,
          appliedAt: new Date(),
        },
      });

      for (const item of adjustment.items) {
        const varianceNum = item.variance.toNumber();
        if (varianceNum !== 0) {
          await LedgerService.recordMovement(
            {
              productId: item.productId,
              locationId: item.locationId,
              quantityDelta: varianceNum,
              referenceDocType: DocType.ADJUSTMENT,
              referenceDocId: adjustment.id,
              referenceDocNumber: adjustment.adjustmentNumber,
              notes: `Stock count adjustment: ${adjustment.reason} (Variance: ${varianceNum > 0 ? '+' : ''}${varianceNum})`,
              createdById: userId,
              allowNegativeStock: true,
            },
            tx
          );
        }
      }

      return updatedAdjustment;
    });
  }
}
