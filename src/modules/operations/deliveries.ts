import prisma from '@/lib/prisma';
import { DocStatus, DocType, Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/service';
import { validateQuantity } from '@/lib/validators';

export interface CreateDeliveryItemInput {
  productId: string;
  quantityOrdered: number;
  locationId?: string;
  unitPrice?: number;
}

export interface CreateDeliveryInput {
  customerName: string;
  customerAddress?: string;
  sourceLocationId: string;
  notes?: string;
  items: CreateDeliveryItemInput[];
}

export class DeliveryService {
  static async generateDeliveryNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.deliveryOrder.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `DEL-${dateStr}-${seq}`;
  }

  static async getAllDeliveries(filters?: { status?: DocStatus; search?: string }) {
    const where: Prisma.DeliveryOrderWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { deliveryNumber: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { customerAddress: { contains: s, mode: 'insensitive' } },
      ];
    }

    return prisma.deliveryOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceLocation: {
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

  static async getDeliveryById(id: string) {
    return prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        sourceLocation: {
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

  static async createDelivery(data: CreateDeliveryInput, userId: string) {
    if (!data.customerName || data.customerName.trim().length < 2) {
      throw new Error('Customer name must be at least 2 characters');
    }
    if (!data.sourceLocationId) {
      throw new Error('Source location is required');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('Delivery order must contain at least one line item');
    }

    for (const item of data.items) {
      const qVal = validateQuantity(item.quantityOrdered);
      if (!qVal.isValid) throw new Error(`Product ${item.productId}: ${qVal.message}`);
    }

    const deliveryNumber = await this.generateDeliveryNumber();

    return prisma.deliveryOrder.create({
      data: {
        deliveryNumber,
        customerName: data.customerName.trim(),
        customerAddress: data.customerAddress?.trim(),
        status: DocStatus.READY,
        sourceLocationId: data.sourceLocationId,
        notes: data.notes?.trim(),
        createdById: userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantityOrdered: new Prisma.Decimal(item.quantityOrdered),
            quantityShipped: new Prisma.Decimal(0),
            locationId: item.locationId || data.sourceLocationId,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
          })),
        },
      },
      include: { items: true },
    });
  }

  static async shipDelivery(deliveryId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { items: { include: { product: true } } },
      });

      if (!delivery) throw new Error('Delivery order not found');
      if (delivery.status === DocStatus.DONE) {
        throw new Error('Delivery order has already been shipped');
      }

      for (const item of delivery.items) {
        const sourceLocId = item.locationId || delivery.sourceLocationId;
        if (!sourceLocId) {
          throw new Error(`Missing source location for item ${item.product.name}`);
        }

        const aggregate = await tx.stockLedger.aggregate({
          where: {
            productId: item.productId,
            locationId: sourceLocId,
          },
          _sum: {
            quantityDelta: true,
          },
        });

        const currentStock = aggregate._sum.quantityDelta?.toNumber() || 0;
        const requestedQty = item.quantityOrdered.toNumber();

        if (currentStock < requestedQty) {
          throw new Error(
            `Cannot dispatch delivery: Insufficient stock for "${item.product.name}" (${item.product.sku}). Available: ${currentStock} ${item.product.unitOfMeasure}, Requested: ${requestedQty} ${item.product.unitOfMeasure}.`
          );
        }
      }

      const updatedDelivery = await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: {
          status: DocStatus.DONE,
          shippedAt: new Date(),
        },
      });

      for (const item of delivery.items) {
        const sourceLocId = item.locationId || delivery.sourceLocationId!;

        await tx.deliveryOrderItem.update({
          where: { id: item.id },
          data: {
            quantityShipped: item.quantityOrdered,
            locationId: sourceLocId,
          },
        });

        await LedgerService.recordMovement(
          {
            productId: item.productId,
            locationId: sourceLocId,
            quantityDelta: -item.quantityOrdered.toNumber(),
            referenceDocType: DocType.DELIVERY,
            referenceDocId: delivery.id,
            referenceDocNumber: delivery.deliveryNumber,
            notes: `Fulfillment dispatched to ${delivery.customerName}`,
            createdById: userId,
            allowNegativeStock: false,
          },
          tx
        );
      }

      return updatedDelivery;
    });
  }
}
