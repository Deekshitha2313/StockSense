const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. src/modules/auth/service.ts
writeFile('src/modules/auth/service.ts', `import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { UserSession } from '@/types';
import { validateEmail, validatePassword } from '@/lib/validators';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'stocksense-super-secure-production-modular-jwt-key-2026'
);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createToken(session: UserSession): Promise<string> {
    return new SignJWT({ ...session })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<UserSession | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        id: payload.id as string,
        name: payload.name as string,
        email: payload.email as string,
        role: payload.role as Role,
      };
    } catch {
      return null;
    }
  }

  static async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await this.createToken(session);
    return { success: true, token, user: session };
  }

  static async register(name: string, email: string, password: string, role: Role = Role.STAFF): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      return { success: false, error: passCheck.message || 'Invalid password' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const passwordHash = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await this.createToken(session);
    return { success: true, token, user: session };
  }

  static async requestOtp(email: string): Promise<{ success: boolean; otp?: string; error?: string }> {
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: true, otp: '123456' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
      },
    });

    return { success: true, otp };
  }

  static async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    if (new Date() > user.otpExpiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new code.' };
    }

    if (user.otpCode !== otp.trim()) {
      return { success: false, error: 'Incorrect OTP code entered' };
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      return { success: false, error: passCheck.message };
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return { success: true };
  }
}`);

// 2. src/modules/auth/session.ts
writeFile('src/modules/auth/session.ts', `import { cookies } from 'next/headers';
import { AuthService } from './service';
import { UserSession } from '@/types';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE_NAME = 'stocksense_session';

export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return AuthService.verifyToken(token);
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireManager(): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== 'MANAGER') {
    redirect('/');
  }
  return session;
}`);

// 3. src/modules/ledger/service.ts
writeFile('src/modules/ledger/service.ts', `import prisma from '@/lib/prisma';
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
        \`Insufficient stock for "\${product?.name || params.productId}" (\${product?.sku || ''}) at "\${location?.name || params.locationId}". Available: \${currentBalance}, Requested: \${Math.abs(deltaNum)}\`
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
      locationName: \`\${e.location.name} (\${e.location.code})\`,
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
}`);

// 4. src/modules/products/service.ts
writeFile('src/modules/products/service.ts', `import prisma from '@/lib/prisma';
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
    const candidate = \`\${categoryPrefix.toUpperCase()}-\${timestamp}-\${random}\`;
    
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
      throw new Error(\`SKU "\${sku}" is already assigned to another product\`);
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
        \`Cannot delete this product because it has \${ledgerCount} recorded transaction(s) in the Stock Ledger. Inventory integrity requires preserving historical ledger records.\`
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
}`);

// 5. src/modules/warehouses/service.ts
writeFile('src/modules/warehouses/service.ts', `import prisma from '@/lib/prisma';
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
      throw new Error(\`Warehouse code "\${code}" already exists\`);
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
      throw new Error(\`Location code "\${code}" already exists in this warehouse\`);
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
}`);

// 6. src/modules/operations/receipts.ts
writeFile('src/modules/operations/receipts.ts', `import prisma from '@/lib/prisma';
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
    return \`REC-\${dateStr}-\${seq}\`;
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
      if (!qVal.isValid) throw new Error(\`Product \${item.productId}: \${qVal.message}\`);
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
            notes: \`Inbound receipt validation - \${receipt.supplierName}\`,
            createdById: userId,
          },
          tx
        );
      }

      return updatedReceipt;
    });
  }
}`);

// 7. src/modules/operations/deliveries.ts
writeFile('src/modules/operations/deliveries.ts', `import prisma from '@/lib/prisma';
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
    return \`DEL-\${dateStr}-\${seq}\`;
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
      if (!qVal.isValid) throw new Error(\`Product \${item.productId}: \${qVal.message}\`);
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
          throw new Error(\`Missing source location for item \${item.product.name}\`);
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
            \`Cannot dispatch delivery: Insufficient stock for "\${item.product.name}" (\${item.product.sku}). Available: \${currentStock} \${item.product.unitOfMeasure}, Requested: \${requestedQty} \${item.product.unitOfMeasure}.\`
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
            notes: \`Fulfillment dispatched to \${delivery.customerName}\`,
            createdById: userId,
            allowNegativeStock: false,
          },
          tx
        );
      }

      return updatedDelivery;
    });
  }
}`);

// 8. src/modules/operations/transfers.ts
writeFile('src/modules/operations/transfers.ts', `import prisma from '@/lib/prisma';
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
    return \`TRF-\${dateStr}-\${seq}\`;
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
      if (!qVal.isValid) throw new Error(\`Product \${item.productId}: \${qVal.message}\`);
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
            \`Cannot execute transfer: Insufficient stock for "\${item.product.name}" (\${item.product.sku}) at \${transfer.sourceLocation.name}. Available: \${currentStock}, Requested: \${requestedQty}.\`
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
            notes: \`Transfer dispatched to \${transfer.destinationLocation.name} (\${transfer.destinationLocation.code})\`,
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
            notes: \`Transfer received from \${transfer.sourceLocation.name} (\${transfer.sourceLocation.code})\`,
            createdById: userId,
            allowNegativeStock: true,
          },
          tx
        );
      }

      return updatedTransfer;
    });
  }
}`);

// 9. src/modules/operations/adjustments.ts
writeFile('src/modules/operations/adjustments.ts', `import prisma from '@/lib/prisma';
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
    return \`ADJ-\${dateStr}-\${seq}\`;
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
      if (!qVal.isValid) throw new Error(\`Product \${item.productId}: \${qVal.message}\`);

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
              notes: \`Stock count adjustment: \${adjustment.reason} (Variance: \${varianceNum > 0 ? '+' : ''}\${varianceNum})\`,
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
}`);

// 10. src/modules/dashboard/service.ts
writeFile('src/modules/dashboard/service.ts', `import prisma from '@/lib/prisma';
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
}`);

console.log('Done modules');
