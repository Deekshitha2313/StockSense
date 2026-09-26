import prisma from '@/lib/prisma';
import { DocStatus, DocType, Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/service';
import { validateQuantity } from '@/lib/validators';

export interface CreateReceiptItemInput {
  productId: string;
  quantityExpected: number;
  locationId?: string;
  unitPrice?: number;
}

export interface CreateReceiptInput {
  supplierName: string;
  supplierInvoice?: string;
  destinationLocationId: string;
  notes?: string;
  items: CreateReceiptItemInput[];
}

export class ReceiptService {
  static async generateReceiptNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.receipt.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `REC-${dateStr}-${seq}`;
  }

  static async getAllReceipts(filters?: { status?: DocStatus; search?: string }) {
    const where: Prisma.ReceiptWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { receiptNumber: { contains: s, mode: 'insensitive' } },
        { supplierName: { contains: s, mode: 'insensitive' } },
        { supplierInvoice: { contains: s, mode: 'insensitive' } },
      ];
    }

    return prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        destinationLocation: {
          include: { warehouse: true },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  static async getReceiptById(id: string) {
    return prisma.receipt.findUnique({
      where: { id },
      include: {
        destinationLocation: {
          include: { warehouse: true },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true, price: true } },
            location: { select: { id: true, name: true, code: true, warehouse: true } },
          },
        },
      },
    });
  }

  static async createReceipt(data: CreateReceiptInput, userId: string) {
    if (!data.supplierName || data.supplierName.trim().length < 2) {
      throw new Error('Supplier name must be at least 2 characters');
    }
    if (!data.destinationLocationId) {
      throw new Error('Destination location is required');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('Receipt must contain at least one line item');
    }

    for (const item of data.items) {
      const qVal = validateQuantity(item.quantityExpected);
      if (!qVal.isValid) throw new Error(`Product ${item.productId}: ${qVal.message}`);
    }

    const receiptNumber = await this.generateReceiptNumber();

    return prisma.receipt.create({
      data: {
        receiptNumber,
        supplierName: data.supplierName.trim(),
        supplierInvoice: data.supplierInvoice?.trim(),
        status: DocStatus.READY,
        destinationLocationId: data.destinationLocationId,
        notes: data.notes?.trim(),
        createdById: userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantityExpected: new Prisma.Decimal(item.quantityExpected),
            quantityReceived: new Prisma.Decimal(0),
            locationId: item.locationId || data.destinationLocationId,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
          })),
        },
      },
      include: { items: true },
    });
  }

  static async validateReceipt(receiptId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: { items: true },
      });

      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === DocStatus.DONE) {
        throw new Error('Receipt is already validated and recorded in ledger');
      }

      const updatedReceipt = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          status: DocStatus.DONE,
          validatedAt: new Date(),
        },
      });

      for (const item of receipt.items) {
        const targetLocationId = item.locationId || receipt.destinationLocationId;
        if (!targetLocationId) {
          throw new Error('Missing location for item in receipt');
        }

        await tx.receiptItem.update({
          where: { id: item.id },
          data: {
            quantityReceived: item.quantityExpected,
            locationId: targetLocationId,
          },
        });

        await LedgerService.recordMovement(
          {
            productId: item.productId,
            locationId: targetLocationId,
            quantityDelta: item.quantityExpected,
            referenceDocType: DocType.RECEIPT,
            referenceDocId: receipt.id,
            referenceDocNumber: receipt.receiptNumber,
            notes: `Inbound receipt validation - ${receipt.supplierName}`,
            createdById: userId,
          },
          tx
        );
      }

      return updatedReceipt;
    });
  }
}
