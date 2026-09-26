const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. src/app/api/auth/login/route.ts
writeFile('src/app/api/auth/login/route.ts', `import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';
import { SESSION_COOKIE_NAME } from '@/modules/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await AuthService.login(email, password);
    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Logged in successfully',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 2. src/app/api/auth/logout/route.ts
writeFile('src/app/api/auth/logout/route.ts', `import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/modules/auth/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}`);

// 3. src/app/api/auth/register/route.ts
writeFile('src/app/api/auth/register/route.ts', `import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';
import { SESSION_COOKIE_NAME } from '@/modules/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    const result = await AuthService.register(name, email, password, role);
    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Account created successfully',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 4. src/app/api/auth/request-otp/route.ts
writeFile('src/app/api/auth/request-otp/route.ts', `import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const result = await AuthService.requestOtp(email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      otp: result.otp,
      message: 'OTP has been generated and sent (see simulated preview)',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'OTP request failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 5. src/app/api/auth/reset-password/route.ts
writeFile('src/app/api/auth/reset-password/route.ts', `import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/service';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();
    const result = await AuthService.resetPasswordWithOtp(email, otp, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Password reset failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 6. src/app/api/products/route.ts
writeFile('src/app/api/products/route.ts', `import { NextResponse } from 'next/server';
import { ProductService } from '@/modules/products/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const products = await ProductService.getAllProducts({
      search,
      categoryId,
      lowStockOnly,
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const product = await ProductService.createProduct(body);

    return NextResponse.json({
      success: true,
      data: product,
      message: \`Product "\${product.name}" created successfully with SKU \${product.sku}\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 7. src/app/api/products/[id]/route.ts
writeFile('src/app/api/products/[id]/route.ts', `import { NextResponse } from 'next/server';
import { ProductService } from '@/modules/products/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await ProductService.getProductById(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch product';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = await ProductService.updateProduct(params.id, body);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Product updated successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, error: 'Only managers can delete products' },
        { status: 403 }
      );
    }

    await ProductService.deleteProduct(params.id);
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 8. src/app/api/warehouses/route.ts
writeFile('src/app/api/warehouses/route.ts', `import { NextResponse } from 'next/server';
import { WarehouseService } from '@/modules/warehouses/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET() {
  try {
    const warehouses = await WarehouseService.getAllWarehouses();
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch warehouses';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const warehouse = await WarehouseService.createWarehouse(body);

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create warehouse';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 9. src/app/api/locations/route.ts
writeFile('src/app/api/locations/route.ts', `import { NextResponse } from 'next/server';
import { WarehouseService } from '@/modules/warehouses/service';
import { getServerSession } from '@/modules/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const locations = await WarehouseService.getLocations(warehouseId);
    return NextResponse.json({ success: true, data: locations });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch locations';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const location = await WarehouseService.createLocation(body);

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create location';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 10. src/app/api/operations/receipts/route.ts
writeFile('src/app/api/operations/receipts/route.ts', `import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const receipts = await ReceiptService.getAllReceipts({ status, search });
    return NextResponse.json({ success: true, data: receipts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch receipts';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const receipt = await ReceiptService.createReceipt(body, session.id);

    return NextResponse.json({
      success: true,
      data: receipt,
      message: \`Receipt "\${receipt.receiptNumber}" created successfully\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 11. src/app/api/operations/receipts/[id]/route.ts
writeFile('src/app/api/operations/receipts/[id]/route.ts', `import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const receipt = await ReceiptService.getReceiptById(params.id);
    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 12. src/app/api/operations/receipts/[id]/validate/route.ts
writeFile('src/app/api/operations/receipts/[id]/validate/route.ts', `import { NextResponse } from 'next/server';
import { ReceiptService } from '@/modules/operations/receipts';
import { getServerSession } from '@/modules/auth/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await ReceiptService.validateReceipt(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: \`Receipt "\${updated.receiptNumber}" successfully validated. Stock has been credited to the ledger.\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to validate receipt';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 13. src/app/api/operations/deliveries/route.ts
writeFile('src/app/api/operations/deliveries/route.ts', `import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const deliveries = await DeliveryService.getAllDeliveries({ status, search });
    return NextResponse.json({ success: true, data: deliveries });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch delivery orders';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const delivery = await DeliveryService.createDelivery(body, session.id);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: \`Delivery order "\${delivery.deliveryNumber}" created successfully\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 14. src/app/api/operations/deliveries/[id]/route.ts
writeFile('src/app/api/operations/deliveries/[id]/route.ts', `import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const delivery = await DeliveryService.getDeliveryById(params.id);
    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: delivery });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 15. src/app/api/operations/deliveries/[id]/ship/route.ts
writeFile('src/app/api/operations/deliveries/[id]/ship/route.ts', `import { NextResponse } from 'next/server';
import { DeliveryService } from '@/modules/operations/deliveries';
import { getServerSession } from '@/modules/auth/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await DeliveryService.shipDelivery(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: \`Delivery order "\${updated.deliveryNumber}" successfully shipped. Stock has been deducted from the ledger.\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to dispatch delivery order';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 16. src/app/api/operations/transfers/route.ts
writeFile('src/app/api/operations/transfers/route.ts', `import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const transfers = await TransferService.getAllTransfers({ status, search });
    return NextResponse.json({ success: true, data: transfers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transfers';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const transfer = await TransferService.createTransfer(body, session.id);

    return NextResponse.json({
      success: true,
      data: transfer,
      message: \`Internal transfer "\${transfer.transferNumber}" created successfully\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 17. src/app/api/operations/transfers/[id]/route.ts
writeFile('src/app/api/operations/transfers/[id]/route.ts', `import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await TransferService.getTransferById(params.id);
    if (!transfer) {
      return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: transfer });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 18. src/app/api/operations/transfers/[id]/execute/route.ts
writeFile('src/app/api/operations/transfers/[id]/execute/route.ts', `import { NextResponse } from 'next/server';
import { TransferService } from '@/modules/operations/transfers';
import { getServerSession } from '@/modules/auth/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await TransferService.executeTransfer(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: \`Internal transfer "\${updated.transferNumber}" successfully executed with dual ledger updates.\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to execute transfer';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 19. src/app/api/operations/adjustments/route.ts
writeFile('src/app/api/operations/adjustments/route.ts', `import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';
import { getServerSession } from '@/modules/auth/session';
import { DocStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DocStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const adjustments = await AdjustmentService.getAllAdjustments({ status, search });
    return NextResponse.json({ success: true, data: adjustments });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch adjustments';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const adjustment = await AdjustmentService.createAdjustment(body, session.id);

    return NextResponse.json({
      success: true,
      data: adjustment,
      message: \`Stock adjustment "\${adjustment.adjustmentNumber}" recorded\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to record adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 20. src/app/api/operations/adjustments/[id]/route.ts
writeFile('src/app/api/operations/adjustments/[id]/route.ts', `import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adjustment = await AdjustmentService.getAdjustmentById(params.id);
    if (!adjustment) {
      return NextResponse.json({ success: false, error: 'Adjustment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: adjustment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 21. src/app/api/operations/adjustments/[id]/apply/route.ts
writeFile('src/app/api/operations/adjustments/[id]/apply/route.ts', `import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/modules/operations/adjustments';
import { getServerSession } from '@/modules/auth/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await AdjustmentService.applyAdjustment(params.id, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: \`Stock adjustment "\${updated.adjustmentNumber}" applied. Variance logged to ledger.\`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to apply adjustment';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}`);

// 22. src/app/api/ledger/route.ts
writeFile('src/app/api/ledger/route.ts', `import { NextResponse } from 'next/server';
import { LedgerService } from '@/modules/ledger/service';
import { DocType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const docType = (searchParams.get('docType') as DocType) || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const history = await LedgerService.getHistory({
      productId,
      locationId,
      warehouseId,
      docType,
      search,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch ledger audit history';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

// 23. src/app/api/dashboard/route.ts
writeFile('src/app/api/dashboard/route.ts', `import { NextResponse } from 'next/server';
import { DashboardService } from '@/modules/dashboard/service';

export async function GET() {
  try {
    const kpis = await DashboardService.getKPIs();
    return NextResponse.json({ success: true, data: kpis });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}`);

console.log('Done API routes');
