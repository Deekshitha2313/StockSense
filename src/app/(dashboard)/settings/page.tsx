'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Warehouse, Plus, Boxes, Layers } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface LocationData {
  id: string;
  name: string;
  code: string;
  type: string;
  currentUnits: number;
}

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  totalUnits: number;
  locationCount: number;
  locations: LocationData[];
}

export default function SettingsPage() {
  const { error, success } = useToast();

  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState('');

  // Form states: Warehouse
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  // Form states: Location
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState('STORAGE');

  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.data);
      }
    } catch {
      error('Failed to load warehouses', 'Error');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: whName, code: whCode, address: whAddress }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to create warehouse', 'Validation Error');
        setSubmitting(false);
        return;
      }

      success(data.message || 'Warehouse added successfully');
      setIsWhModalOpen(false);
      setWhName('');
      setWhCode('');
      setWhAddress('');
      fetchWarehouses();
    } catch {
      error('Failed to connect to warehouse service', 'Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: selectedWhId,
          name: locName,
          code: locCode,
          type: locType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to create location rack', 'Validation Error');
        setSubmitting(false);
        return;
      }

      success(data.message || 'Location bay added');
      setIsLocModalOpen(false);
      setLocName('');
      setLocCode('');
      fetchWarehouses();
    } catch {
      error('Failed to connect to location service', 'Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddLocationModal = (warehouseId: string) => {
    setSelectedWhId(warehouseId);
    setLocName('');
    setLocCode('');
    setLocType('STORAGE');
    setIsLocModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Warehouse className="w-6 h-6 text-blue-500" />
            <span>Warehouses & Locations Topology</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure distribution centers, picking shelves, staging bays, and storage racks
          </p>
        </div>

        <button
          onClick={() => setIsWhModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Warehouse</span>
        </button>
      </div>

      {/* Warehouse List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl">
            Loading warehouse topology...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl">
            No warehouses registered. Click &quot;New Warehouse&quot; to set one up.
          </div>
        ) : (
          warehouses.map((wh) => (
            <div
              key={wh.id}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden"
            >
              {/* Warehouse Header */}
              <div className="p-6 bg-slate-850/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">{wh.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        {wh.code}
                      </span>
                    </div>
                    {wh.address && (
                      <p className="text-xs text-slate-400 mt-0.5">{wh.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Units Stored</div>
                    <div className="text-lg font-black text-emerald-400">
                      {formatNumber(wh.totalUnits)}
                    </div>
                  </div>
                  <button
                    onClick={() => openAddLocationModal(wh.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rack / Bay</span>
                  </button>
                </div>
              </div>

              {/* Locations Grid */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Configured Storage Locations ({wh.locations.length})</span>
                </h4>

                {wh.locations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900 rounded-xl">
                    No specific racks or bays created yet for this warehouse.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {wh.locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {loc.code}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {loc.type}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-2 truncate">
                          {loc.name}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                          <span className="flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5 text-slate-500" />
                            <span>Units:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {formatNumber(loc.currentUnits)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Warehouse */}
      <Modal
        isOpen={isWhModalOpen}
        onClose={() => setIsWhModalOpen(false)}
        title="Add New Warehouse"
        subtitle="Register an operational facility or regional logistics hub"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Warehouse Facility Name *
            </label>
            <input
              type="text"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              placeholder="e.g. South Central Distribution Hub"
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Unique Code *
            </label>
            <input
              type="text"
              value={whCode}
              onChange={(e) => setWhCode(e.target.value)}
              placeholder="e.g. WH-SOUTH"
              required
              className="w-full font-mono uppercase bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Physical Street Address
            </label>
            <textarea
              rows={2}
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
              placeholder="500 Trade Port Expressway, Dallas, TX 75261"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsWhModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Location Rack */}
      <Modal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        title="Add Location Rack / Storage Bay"
        subtitle="Define a specific storage point inside this warehouse"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Location Name *
            </label>
            <input
              type="text"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder="e.g. Aisle 3 - Pallet Rack 04"
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Location Identifier Code *
            </label>
            <input
              type="text"
              value={locCode}
              onChange={(e) => setLocCode(e.target.value)}
              placeholder="e.g. LOC-R304"
              required
              className="w-full font-mono uppercase bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Operational Bay Type
            </label>
            <select
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STORAGE">STORAGE (Standard High-Density Rack)</option>
              <option value="RECEIVING">RECEIVING (Inbound Staging Bay)</option>
              <option value="SHIPPING">SHIPPING (Outbound Dock / Packing)</option>
              <option value="STAGING">STAGING (Cross-Dock Temporary Area)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLocModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
            >
              {submitting ? 'Adding...' : 'Add Storage Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
