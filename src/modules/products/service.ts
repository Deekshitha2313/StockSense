import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProductWithStock } from '@/types';
import { validateSku, validatePrice, validateQuantity } from '@/lib/validators';
import { LedgerService } from '../ledger/service';

export interface CreateProductInput {
  sku?: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasure?: string;
  price: number;
  cost?: number;
  minStockThreshold?: number;
}

export class ProductService {
  static async generateSku(categoryPrefix = 'PRD'): Promise<string> {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(100 + Math.random() * 900);
    const candidate = `${categoryPrefix.toUpperCase()}-${timestamp}-${random}`;
    
    const existing = await prisma.product.findUnique({
      where: { sku: candidate },
    });
    
    if (existing) {
      return this.generateSku(categoryPrefix);
    }
    return candidate;
  }

  static async getAllProducts(filters?: {
    search?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
  }): Promise<ProductWithStock[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const stockAggregates = await prisma.stockLedger.groupBy({
      by: ['productId'],
      _sum: {
        quantityDelta: true,
      },
    });

    const stockMap = new Map<string, number>();
    for (const agg of stockAggregates) {
      stockMap.set(agg.productId, agg._sum.quantityDelta ? agg._sum.quantityDelta.toNumber() : 0);
    }

    const result: ProductWithStock[] = products.map((p) => {
      const currentStock = stockMap.get(p.id) || 0;
      const minStock = p.minStockThreshold.toNumber();
      const priceNum = p.price.toNumber();
      const costNum = p.cost.toNumber();

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        category: p.category,
        unitOfMeasure: p.unitOfMeasure,
        price: priceNum,
        cost: costNum,
        minStockThreshold: minStock,
        currentStock,
        isLowStock: currentStock <= minStock,
        stockValue: currentStock * priceNum,
      };
    });

    if (filters?.lowStockOnly) {
      return result.filter((p) => p.isLowStock);
    }

    return result;
  }

  static async getProductById(id: string): Promise<ProductWithStock | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) return null;

    const stockDetails = await LedgerService.getProductStock(id);
    const minStock = product.minStockThreshold.toNumber();
    const priceNum = product.price.toNumber();
    const costNum = product.cost.toNumber();

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      price: priceNum,
      cost: costNum,
      minStockThreshold: minStock,
      currentStock: stockDetails.totalStock,
      isLowStock: stockDetails.totalStock <= minStock,
      stockValue: stockDetails.totalStock * priceNum,
      locationsBreakdown: stockDetails.breakdown,
    };
  }

  static async createProduct(data: CreateProductInput) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Product name must be at least 2 characters');
    }

    const sku = data.sku ? data.sku.trim().toUpperCase() : await this.generateSku();
    const skuValidation = validateSku(sku);
    if (!skuValidation.isValid) {
      throw new Error(skuValidation.message);
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku },
    });
    if (existingSku) {
      throw new Error(`SKU "${sku}" is already assigned to another product`);
    }

    const priceVal = validatePrice(data.price);
    if (!priceVal.isValid) throw new Error(priceVal.message);

    const costVal = validatePrice(data.cost ?? 0);
    if (!costVal.isValid) throw new Error(costVal.message);

    const thresholdVal = validateQuantity(data.minStockThreshold ?? 10, true);
    if (!thresholdVal.isValid) throw new Error(thresholdVal.message);

    return prisma.product.create({
      data: {
        sku,
        name: data.name.trim(),
        description: data.description?.trim(),
        categoryId: data.categoryId,
        unitOfMeasure: data.unitOfMeasure?.trim() || 'Units',
        price: new Prisma.Decimal(priceVal.num),
        cost: new Prisma.Decimal(costVal.num),
        minStockThreshold: new Prisma.Decimal(thresholdVal.num),
      },
      include: { category: true },
    });
  }

  static async updateProduct(id: string, data: Partial<CreateProductInput>) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');

    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) {
      if (data.name.trim().length < 2) throw new Error('Name must be at least 2 characters');
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    }

    if (data.unitOfMeasure !== undefined) {
      updateData.unitOfMeasure = data.unitOfMeasure.trim();
    }

    if (data.price !== undefined) {
      const v = validatePrice(data.price);
      if (!v.isValid) throw new Error(v.message);
      updateData.price = new Prisma.Decimal(v.num);
    }

    if (data.cost !== undefined) {
      const v = validatePrice(data.cost);
      if (!v.isValid) throw new Error(v.message);
      updateData.cost = new Prisma.Decimal(v.num);
    }

    if (data.minStockThreshold !== undefined) {
      const v = validateQuantity(data.minStockThreshold, true);
      if (!v.isValid) throw new Error(v.message);
      updateData.minStockThreshold = new Prisma.Decimal(v.num);
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  static async deleteProduct(id: string) {
    const ledgerCount = await prisma.stockLedger.count({
      where: { productId: id },
    });

    if (ledgerCount > 0) {
      throw new Error(
        `Cannot delete this product because it has ${ledgerCount} recorded transaction(s) in the Stock Ledger. Inventory integrity requires preserving historical ledger records.`
      );
    }

    return prisma.product.delete({
      where: { id },
    });
  }

  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
