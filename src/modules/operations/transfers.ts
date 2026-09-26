import prisma from '@/lib/prisma';
import { DocStatus, DocType, Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/service';
import { validateQuantity } from '@/lib/validators';

export interface CreateTransferItemInput {
  productId: string;
  quantity: number;
}

export interface CreateTransferInput {
  sourceLocationId: string;
  destinationLocationId: string;
  notes?: string;
  items: CreateTransferItemInput[];
}

export class TransferService {
  static async generateTransferNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.internalTransfer.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `TRF-${dateStr}-${seq}`;
  }

  static async getAllTransfers(filters?: { status?: DocStatus; search?: string }) {
    const where: Prisma.InternalTransferWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { transferNumber: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
      ];
    }

    return prisma.internalTransfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
          },
        },
      },
    });
  }

  static async getTransferById(id: string) {
    return prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
          },
        },
      },
    });
  }

  static async createTransfer(data: CreateTransferInput, userId: string) {
    if (!data.sourceLocationId || !data.destinationLocationId) {
      throw new Error('Both source and destination locations are required');
    }
    if (data.sourceLocationId === data.destinationLocationId) {
      throw new Error('Source and destination locations cannot be the same');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('Transfer must include at least one item');
    }

    for (const item of data.items) {
      const qVal = validateQuantity(item.quantity);
      if (!qVal.isValid) throw new Error(`Product ${item.productId}: ${qVal.message}`);
    }

    const transferNumber = await this.generateTransferNumber();

    return prisma.internalTransfer.create({
      data: {
        transferNumber,
        sourceLocationId: data.sourceLocationId,
        destinationLocationId: data.destinationLocationId,
        status: DocStatus.READY,
        notes: data.notes?.trim(),
        createdById: userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
          })),
        },
      },
      include: { items: true },
    });
  }

  static async executeTransfer(transferId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.internalTransfer.findUnique({
        where: { id: transferId },
        include: {
          items: { include: { product: true } },
          sourceLocation: true,
          destinationLocation: true,
        },
      });

      if (!transfer) throw new Error('Transfer record not found');
      if (transfer.status === DocStatus.DONE) {
        throw new Error('This transfer has already been executed');
      }

      for (const item of transfer.items) {
        const aggregate = await tx.stockLedger.aggregate({
          where: {
            productId: item.productId,
            locationId: transfer.sourceLocationId,
          },
          _sum: {
            quantityDelta: true,
          },
        });

        const currentStock = aggregate._sum.quantityDelta?.toNumber() || 0;
        const requestedQty = item.quantity.toNumber();

        if (currentStock < requestedQty) {
          throw new Error(
            `Cannot execute transfer: Insufficient stock for "${item.product.name}" (${item.product.sku}) at ${transfer.sourceLocation.name}. Available: ${currentStock}, Requested: ${requestedQty}.`
          );
        }
      }

      const updatedTransfer = await tx.internalTransfer.update({
        where: { id: transferId },
        data: {
          status: DocStatus.DONE,
          executedAt: new Date(),
        },
      });

      for (const item of transfer.items) {
        const qty = item.quantity.toNumber();

        await LedgerService.recordMovement(
          {
            productId: item.productId,
            locationId: transfer.sourceLocationId,
            quantityDelta: -qty,
            referenceDocType: DocType.TRANSFER,
            referenceDocId: transfer.id,
            referenceDocNumber: transfer.transferNumber,
            notes: `Transfer dispatched to ${transfer.destinationLocation.name} (${transfer.destinationLocation.code})`,
            createdById: userId,
            allowNegativeStock: false,
          },
          tx
        );

        await LedgerService.recordMovement(
          {
            productId: item.productId,
            locationId: transfer.destinationLocationId,
            quantityDelta: qty,
            referenceDocType: DocType.TRANSFER,
            referenceDocId: transfer.id,
            referenceDocNumber: transfer.transferNumber,
            notes: `Transfer received from ${transfer.sourceLocation.name} (${transfer.sourceLocation.code})`,
            createdById: userId,
            allowNegativeStock: true,
          },
          tx
        );
      }

      return updatedTransfer;
    });
  }
}
