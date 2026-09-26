import React from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  Warehouse,
  Plus,
  Boxes,
} from 'lucide-react';
import { DashboardService } from '@/modules/dashboard/service';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/formatters';
import { DocTypeBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpis = await DashboardService.getKPIs();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Inventory Overview</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-warehouse inventory telemetry & immutable ledger audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products?action=new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/operations?tab=receipts&action=new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Inbound Intake</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total On-Hand Units</div>
            <div className="text-2xl font-black text-white mt-1.5">{formatNumber(kpis.totalInventoryUnits)}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Across {kpis.warehouseCapacities.length} active hubs</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inventory Value</div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">{formatCurrency(kpis.totalInventoryValuation)}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Current asset valuation</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catalog SKUs</div>
            <div className="text-2xl font-black text-white mt-1.5">{kpis.totalProducts}</div>
            <div className="text-[11px] text-slate-400 mt-1">Managed item references</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Warnings</div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{kpis.lowStockCount}</div>
            <Link
              href="/products?lowStockOnly=true"
              className="text-[11px] text-amber-400/90 hover:underline mt-1 inline-block"
            >
              Inspect low stock items &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/operations?tab=receipts"
          className="glass-card p-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Pending Receipts</div>
              <div className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                {kpis.pendingReceiptsCount} Awaiting Intake
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-300 transition">&rarr;</span>
        </Link>

        <Link
          href="/operations?tab=deliveries"
          className="glass-card p-4 rounded-xl border border-slate-800 hover:border-rose-500/40 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Pending Deliveries</div>
              <div className="text-lg font-bold text-white group-hover:text-rose-400 transition">
                {kpis.pendingDeliveriesCount} Ready to Ship
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-300 transition">&rarr;</span>
        </Link>

        <Link
          href="/operations?tab=transfers"
          className="glass-card p-4 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Internal Transfers</div>
              <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition">
                {kpis.activeTransfersCount} Active in Transit
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-300 transition">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span>Valuation by Category</span>
          </h3>
          <div className="space-y-4">
            {kpis.stockByCategory.map((cat) => {
              const pct = kpis.totalInventoryValuation > 0
                ? Math.round((cat.value / kpis.totalInventoryValuation) * 100)
                : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{cat.category}</span>
                    <span className="font-semibold text-slate-200">
                      {formatCurrency(cat.value)}{' '}
                      <span className="text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            <span>Warehouse Distribution</span>
          </h3>
          <div className="space-y-4">
            {kpis.warehouseCapacities.map((wh) => (
              <div
                key={wh.warehouse}
                className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-slate-200">{wh.warehouse}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {wh.locationCount} configured racks / storage bays
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-blue-400">
                    {formatNumber(wh.units)} units
                  </div>
                  <div className="text-[10px] text-slate-500">Live on-hand balance</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Recent Stock Movements (Audit Trail)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live double-entry transactions verified by the Stock Ledger engine
            </p>
          </div>
          <Link
            href="/move-history"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Full Ledger Log &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Document</th>
                <th className="py-3 px-6">Product / SKU</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6 text-right">Delta (Change)</th>
                <th className="py-3 px-6 text-right">Balance After</th>
                <th className="py-3 px-6">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {kpis.recentLedgerEntries.map((e) => (
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
                  <td className="py-3 px-6">
                    <div className="font-semibold text-slate-100">{e.productName}</div>
                    <div className="font-mono text-[11px] text-slate-400">{e.productSku}</div>
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap text-slate-300">
                    <div>{e.locationName}</div>
                    <div className="text-[10px] text-slate-500">{e.warehouseName}</div>
                  </td>
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    <span
                      className={`font-mono font-bold ${
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
                  <td className="py-3 px-6 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                    {formatNumber(e.balanceAfter)}
                  </td>
                  <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                    {e.createdByName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
