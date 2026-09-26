'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { DocType } from '@prisma/client';
import { StockLedgerEntryDTO } from '@/types';
import { formatDateTime, formatNumber } from '@/lib/formatters';
import { DocTypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function MoveHistoryPage() {
  const { error } = useToast();

  const [entries, setEntries] = useState<StockLedgerEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState<string>('');
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (docType) params.set('docType', docType);
      if (selectedWarehouse) params.set('warehouseId', selectedWarehouse);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch {
      error('Failed to load ledger history', 'Error');
    } finally {
      setLoading(false);
    }
  }, [search, docType, selectedWarehouse, error]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-blue-500" />
          <span>Move History (Immutable Stock Ledger)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete, unalterable double-entry transaction audit log tracking all stock inflows, dispatches, and transfers
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doc number, SKU, product, location, or notes..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Document Types</option>
            <option value="RECEIPT">Receipts (+ Intake)</option>
            <option value="DELIVERY">Deliveries (- Outflow)</option>
            <option value="TRANSFER">Internal Transfers (⇄)</option>
            <option value="ADJUSTMENT">Adjustments (Δ Cycle Count)</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Doc Type</th>
                <th className="py-3 px-6">Reference ID</th>
                <th className="py-3 px-6">Product / SKU</th>
                <th className="py-3 px-6">Storage Location</th>
                <th className="py-3 px-6 text-right">Delta (Change)</th>
                <th className="py-3 px-6 text-right">Balance After</th>
                <th className="py-3 px-6">Notes / Memo</th>
                <th className="py-3 px-6">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading ledger records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No movements recorded yet matching the selected filter.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <DocTypeBadge type={e.referenceDocType as DocType} />
                    </td>
                    <td className="py-3 px-6 font-mono font-semibold text-slate-200 whitespace-nowrap">
                      {e.referenceDocNumber}
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-100">{e.productName}</div>
                      <div className="font-mono text-[11px] text-blue-400">{e.productSku}</div>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{e.locationName}</div>
                      <div className="text-[10px] text-slate-400">{e.warehouseName}</div>
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
                    <td className="py-3 px-6 whitespace-nowrap text-slate-400">
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
