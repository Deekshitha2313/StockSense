import { NextResponse } from 'next/server';
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
      message: `Product "${product.name}" created successfully with SKU ${product.sku}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
