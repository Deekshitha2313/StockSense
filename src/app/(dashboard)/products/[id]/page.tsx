'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  AlertTriangle,
  Boxes,
  MapPin,
  TrendingUp,
  History,
  Tag,
} from 'lucide-react';
import { ProductWithStock, StockLedgerEntryDTO } from '@/types';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/formatters';
import { DocTypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { error } = useToast();

  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, ledRes] = await Promise.all([
        fetch(`/api/products/${params.id}`),
        fetch(`/api/ledger?productId=${params.id}`),
      ]);

      const [pData, lData] = await Promise.all([prodRes.json(), ledRes.json()]);

      if (pData.success) {
        setProduct(pData.data);
      } else {
        error(pData.error || 'Product not found', 'Error');
        router.push('/products');
      }

      if (lData.success) {
        setLedgerEntries(lData.data);
      }
    } catch {
      error('Failed to load product details', 'Network Error');
    } finally {
      setLoading(false);
    }
  }, [params.id, error, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl animate-pulse">
        Loading product telemetry and ledger trail...
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{product.name}</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {product.sku}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Category: <span className="text-slate-300 font-medium">{product.category.name}</span> • UoM:{' '}
              <span className="text-slate-300 font-medium">{product.unitOfMeasure}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On-hand stock */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              On-Hand Stock
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {formatNumber(product.currentStock)} {product.unitOfMeasure}
            </div>
            <div
              className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${
                product.isLowStock ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {product.isLowStock ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Below Reorder Threshold ({product.minStockThreshold})</span>
                </>
              ) : (
                <span>Optimal Stock Level</span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Total Valuation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Stock Asset Value
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(product.stockValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Selling valuation</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Selling Price */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unit Selling Price
            </div>
            <div className="text-2xl font-black text-slate-100 mt-1">
              {formatCurrency(product.price)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Per {product.unitOfMeasure}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Cost Price */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Acquisition Cost
            </div>
            <div className="text-2xl font-black text-slate-100 mt-1">
              {formatCurrency(product.cost)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Unit margin: {formatCurrency(product.price - product.cost)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Warehouse Locations Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Warehouse Location Breakdown</span>
        </h3>

        {product.locationsBreakdown && product.locationsBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {product.locationsBreakdown.map((loc) => (
              <div
                key={loc.locationId}
                className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{loc.locationName}</div>
                  <div className="text-[11px] text-slate-400">{loc.warehouseName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-base text-blue-400">
                    {formatNumber(loc.quantity)}
                  </div>
                  <div className="text-[10px] text-slate-500">{product.unitOfMeasure}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-900 rounded-xl">
            No on-hand inventory currently recorded in any storage bay.
          </div>
        )}
      </div>

      {/* Historical Stock Ledger Audit Trail for this product */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Product Ledger Transaction History</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable movement records affecting this SKU
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Document</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6 text-right">Delta (Change)</th>
                <th className="py-3 px-6 text-right">Balance After</th>
                <th className="py-3 px-6">Notes / Memo</th>
                <th className="py-3 px-6">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No ledger transactions recorded yet for this product.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DocTypeBadge type={e.referenceDocType} />
                        <span className="font-mono text-slate-200 font-medium">
                          {e.referenceDocNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div>{e.locationName}</div>
                      <div className="text-[10px] text-slate-500">{e.warehouseName}</div>
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold text-sm ${
                          e.quantityDelta > 0
                            ? 'text-emerald-400'
                            : e.quantityDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {e.quantityDelta > 0 ? `+${e.quantityDelta}` : e.quantityDelta}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatNumber(e.balanceAfter)}
                    </td>
                    <td className="py-3 px-6 text-slate-400 max-w-xs truncate">
                      {e.notes || '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                      {e.createdByName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
