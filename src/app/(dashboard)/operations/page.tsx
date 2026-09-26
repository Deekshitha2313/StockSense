'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Plus,
  CheckCircle,
  Truck,
  RotateCw,
  Search,
} from 'lucide-react';
import { DocStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/formatters';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';

type TabType = 'receipts' | 'deliveries' | 'transfers' | 'adjustments';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
}

interface LocationItem {
  id: string;
  name: string;
  code: string;
  warehouse: { name: string };
}

export default function OperationsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'receipts';
  const initialAction = searchParams.get('action');

  const { error, success } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Data sets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialAction === 'new');
  const [submitting, setSubmitting] = useState(false);

  // Form states: Receipts
  const [recSupplier, setRecSupplier] = useState('');
  const [recInvoice, setRecInvoice] = useState('');
  const [recDestLoc, setRecDestLoc] = useState('');
  const [recProductId, setRecProductId] = useState('');
  const [recQty, setRecQty] = useState('10');

  // Form states: Deliveries
  const [delCustomer, setDelCustomer] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delSourceLoc, setDelSourceLoc] = useState('');
  const [delProductId, setDelProductId] = useState('');
  const [delQty, setDelQty] = useState('5');

  // Form states: Transfers
  const [trfSourceLoc, setTrfSourceLoc] = useState('');
  const [trfDestLoc, setTrfDestLoc] = useState('');
  const [trfProductId, setTrfProductId] = useState('');
  const [trfQty, setTrfQty] = useState('5');

  // Form states: Adjustments
  const [adjReason, setAdjReason] = useState('Annual Physical Inventory Audit');
  const [adjLoc, setAdjLoc] = useState('');
  const [adjProductId, setAdjProductId] = useState('');
  const [adjCountedQty, setAdjCountedQty] = useState('50');

  // Fetch lookups (products & locations)
  const fetchLookups = useCallback(async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/locations'),
      ]);
      const [pData, lData] = await Promise.all([prodRes.json(), locRes.json()]);
      if (pData.success) {
        setProducts(pData.data);
        if (pData.data.length > 0) {
          setRecProductId(pData.data[0].id);
          setDelProductId(pData.data[0].id);
          setTrfProductId(pData.data[0].id);
          setAdjProductId(pData.data[0].id);
        }
      }
      if (lData.success) {
        setLocations(lData.data);
        if (lData.data.length > 1) {
          setRecDestLoc(lData.data[0].id);
          setDelSourceLoc(lData.data[0].id);
          setTrfSourceLoc(lData.data[0].id);
          setTrfDestLoc(lData.data[1].id);
          setAdjLoc(lData.data[0].id);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const res = await fetch(`/api/operations/${activeTab}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch {
      error(`Failed to fetch ${activeTab} data`, 'Error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, error]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Operations actions
  const handleValidateReceipt = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/receipts/${id}/validate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to validate receipt', 'Receipt Error');
        return;
      }
      success(data.message || 'Receipt validated and posted to stock ledger');
      fetchRecords();
    } catch {
      error('Failed to validate receipt', 'Network Error');
    }
  };

  const handleShipDelivery = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/deliveries/${id}/ship`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Cannot ship delivery', 'Stock Depletion Warning');
        return;
      }
      success(data.message || 'Delivery dispatched and deducted from ledger');
      fetchRecords();
    } catch {
      error('Failed to dispatch delivery', 'Network Error');
    }
  };

  const handleExecuteTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/transfers/${id}/execute`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Transfer failed', 'Transfer Error');
        return;
      }
      success(data.message || 'Transfer executed with dual-entry ledger records');
      fetchRecords();
    } catch {
      error('Failed to execute transfer', 'Network Error');
    }
  };

  const handleApplyAdjustment = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/adjustments/${id}/apply`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Adjustment failed', 'Adjustment Error');
        return;
      }
      success(data.message || 'Adjustment applied to ledger');
      fetchRecords();
    } catch {
      error('Failed to apply adjustment', 'Network Error');
    }
  };

  // Create handlers
  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let url = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any = {};

      if (activeTab === 'receipts') {
        url = '/api/operations/receipts';
        payload = {
          supplierName: recSupplier,
          supplierInvoice: recInvoice,
          destinationLocationId: recDestLoc,
          items: [{ productId: recProductId, quantityExpected: parseFloat(recQty) }],
        };
      } else if (activeTab === 'deliveries') {
        url = '/api/operations/deliveries';
        payload = {
          customerName: delCustomer,
          customerAddress: delAddress,
          sourceLocationId: delSourceLoc,
          items: [{ productId: delProductId, quantityOrdered: parseFloat(delQty) }],
        };
      } else if (activeTab === 'transfers') {
        url = '/api/operations/transfers';
        payload = {
          sourceLocationId: trfSourceLoc,
          destinationLocationId: trfDestLoc,
          items: [{ productId: trfProductId, quantity: parseFloat(trfQty) }],
        };
      } else if (activeTab === 'adjustments') {
        url = '/api/operations/adjustments';
        payload = {
          reason: adjReason,
          items: [{ productId: adjProductId, locationId: adjLoc, countedQuantity: parseFloat(adjCountedQty) }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to create operation record', 'Validation Error');
        setSubmitting(false);
        return;
      }

      success(data.message || 'Operation recorded');
      setIsDrawerOpen(false);
      fetchRecords();
    } catch {
      error('Communication failure with operation service', 'Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <RotateCw className="w-6 h-6 text-blue-500" />
            <span>Warehouse Operations Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute inbound receipts, delivery dispatches, internal bin transfers, and stock adjustments
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span>
            New{' '}
            {activeTab === 'receipts'
              ? 'Inbound Receipt'
              : activeTab === 'deliveries'
              ? 'Delivery Order'
              : activeTab === 'transfers'
              ? 'Internal Transfer'
              : 'Cycle Count'}
          </span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'receipts'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span>1. Receipts (Inbound Stock)</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'deliveries'
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span>2. Deliveries (Outbound Shipping)</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'transfers'
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>3. Internal Transfers</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'adjustments'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>4. Stock Adjustments (Cycle Count)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab} by reference ID, entity name, or notes...`}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Main Operations Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Reference No</th>
                <th className="py-3 px-6">
                  {activeTab === 'receipts'
                    ? 'Supplier'
                    : activeTab === 'deliveries'
                    ? 'Customer'
                    : activeTab === 'transfers'
                    ? 'Topology Route'
                    : 'Adjustment Reason'}
                </th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Items Summary</th>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading operation records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No {activeTab} records found. Create one using the &quot;New&quot; button above.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                records.map((r: any) => {
                  const isDone = r.status === DocStatus.DONE;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-6 font-mono font-bold text-slate-100 whitespace-nowrap">
                        {r.receiptNumber ||
                          r.deliveryNumber ||
                          r.transferNumber ||
                          r.adjustmentNumber}
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-200">
                        {r.supplierName ||
                          r.customerName ||
                          (r.sourceLocation && r.destinationLocation
                            ? `${r.sourceLocation.code} → ${r.destinationLocation.code}`
                            : r.reason)}
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-slate-400">
                        {r.destinationLocation?.name ||
                          r.sourceLocation?.name ||
                          r.items?.[0]?.location?.name ||
                          '—'}
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-6">
                        <div className="space-y-0.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {r.items?.map((item: any) => (
                            <div key={item.id} className="text-[11px] text-slate-300">
                              <span className="font-semibold text-slate-100">
                                {item.product?.name || item.product?.sku}
                              </span>
                              : {item.quantityExpected || item.quantityOrdered || item.quantity || `${item.variance > 0 ? '+' : ''}${item.variance}`} {item.product?.unitOfMeasure}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-slate-400">
                        {formatDateTime(r.validatedAt || r.shippedAt || r.executedAt || r.appliedAt || r.createdAt)}
                      </td>
                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        {activeTab === 'receipts' && !isDone && (
                          <button
                            onClick={() => handleValidateReceipt(r.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow-emerald transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Validate Intake</span>
                          </button>
                        )}
                        {activeTab === 'deliveries' && !isDone && (
                          <button
                            onClick={() => handleShipDelivery(r.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Ship Fulfillment</span>
                          </button>
                        )}
                        {activeTab === 'transfers' && !isDone && (
                          <button
                            onClick={() => handleExecuteTransfer(r.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Execute Dual-Entry</span>
                          </button>
                        )}
                        {activeTab === 'adjustments' && !isDone && (
                          <button
                            onClick={() => handleApplyAdjustment(r.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Apply to Ledger</span>
                          </button>
                        )}
                        {isDone && (
                          <span className="text-[11px] font-medium text-slate-500">
                            Ledger Recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for creating new operations */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          activeTab === 'receipts'
            ? 'New Inbound Receipt'
            : activeTab === 'deliveries'
            ? 'New Delivery Dispatch'
            : activeTab === 'transfers'
            ? 'New Internal Transfer'
            : 'New Cycle Count Adjustment'
        }
        subtitle="Submit operation payload to initialize transaction workflow"
      >
        <form onSubmit={handleCreateOperation} className="space-y-4">
          {activeTab === 'receipts' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={recSupplier}
                  onChange={(e) => setRecSupplier(e.target.value)}
                  placeholder="e.g. Apex Precision Technologies"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Supplier Invoice No.
                </label>
                <input
                  type="text"
                  value={recInvoice}
                  onChange={(e) => setRecInvoice(e.target.value)}
                  placeholder="INV-99201"
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Receiving Destination Location *
                </label>
                <select
                  value={recDestLoc}
                  onChange={(e) => setRecDestLoc(e.target.value)}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse.name} - {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Item *
                  </label>
                  <select
                    value={recProductId}
                    onChange={(e) => setRecProductId(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Expected Intake Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={recQty}
                    onChange={(e) => setRecQty(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'deliveries' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer / Client *
                </label>
                <input
                  type="text"
                  value={delCustomer}
                  onChange={(e) => setDelCustomer(e.target.value)}
                  placeholder="e.g. RoboTech Automations Inc."
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Shipping Address
                </label>
                <input
                  type="text"
                  value={delAddress}
                  onChange={(e) => setDelAddress(e.target.value)}
                  placeholder="780 Industrial Highway, Detroit, MI"
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fulfillment Source Location *
                </label>
                <select
                  value={delSourceLoc}
                  onChange={(e) => setDelSourceLoc(e.target.value)}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse.name} - {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Item *
                  </label>
                  <select
                    value={delProductId}
                    onChange={(e) => setDelProductId(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Dispatch Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={delQty}
                    onChange={(e) => setDelQty(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'transfers' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Origin (Source Location) *
                </label>
                <select
                  value={trfSourceLoc}
                  onChange={(e) => setTrfSourceLoc(e.target.value)}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse.name} - {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target (Destination Location) *
                </label>
                <select
                  value={trfDestLoc}
                  onChange={(e) => setTrfDestLoc(e.target.value)}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse.name} - {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Item *
                  </label>
                  <select
                    value={trfProductId}
                    onChange={(e) => setTrfProductId(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Transfer Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={trfQty}
                    onChange={(e) => setTrfQty(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'adjustments' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audit Reconciliation Reason *
                </label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Cycle count discrepancy or damaged items discard"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audit Target Location *
                </label>
                <select
                  value={adjLoc}
                  onChange={(e) => setAdjLoc(e.target.value)}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse.name} - {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Item *
                  </label>
                  <select
                    value={adjProductId}
                    onChange={(e) => setAdjProductId(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Physical Counted Qty *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjCountedQty}
                    onChange={(e) => setAdjCountedQty(e.target.value)}
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                The engine will automatically compute variance: Counted Qty − Recorded Ledger Stock.
              </p>
            </>
          )}

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Save Operation'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
