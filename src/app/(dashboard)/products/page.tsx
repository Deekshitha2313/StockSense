'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  MapPin,
  Sparkles,
  Edit2,
  Trash2,
  Boxes,
} from 'lucide-react';
import { ProductWithStock } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';

export default function ProductsPage() {
  const { error, success } = useToast();

  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Stock-per-location modal state
  const [inspectProduct, setInspectProduct] = useState<ProductWithStock | null>(null);

  // Create / Edit Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUom, setFormUom] = useState('pcs');
  const [formPrice, setFormPrice] = useState('0.00');
  const [formCost, setFormCost] = useState('0.00');
  const [formMinThreshold, setFormMinThreshold] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (lowStockOnly) params.set('lowStockOnly', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch {
      error('Failed to load products list', 'Fetch Error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, lowStockOnly, error]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.data) {
        const uniqueCats = Array.from(
          new Map(data.data.map((p: ProductWithStock) => [p.category.id, p.category])).values()
        ) as { id: string; name: string }[];
        setCategories(uniqueCats);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateDrawer = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormCategoryId(categories[0]?.id || '');
    setFormUom('pcs');
    setFormPrice('0.00');
    setFormCost('0.00');
    setFormMinThreshold('10');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (p: ProductWithStock) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormDescription(p.description || '');
    setFormCategoryId(p.categoryId);
    setFormUom(p.unitOfMeasure);
    setFormPrice(p.price.toString());
    setFormCost(p.cost.toString());
    setFormMinThreshold(p.minStockThreshold.toString());
    setIsDrawerOpen(true);
  };

  const handleAutoGenerateSku = () => {
    const timestamp = Date.now().toString().slice(-4);
    const rand = Math.floor(100 + Math.random() * 900);
    setFormSku(`PRD-${timestamp}-${rand}`);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formName,
        sku: formSku || undefined,
        description: formDescription,
        categoryId: formCategoryId,
        unitOfMeasure: formUom,
        price: parseFloat(formPrice),
        cost: parseFloat(formCost),
        minStockThreshold: parseFloat(formMinThreshold),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to save product', 'Save Error');
        setSubmitting(false);
        return;
      }

      success(data.message || 'Product saved successfully');
      setIsDrawerOpen(false);
      fetchProducts();
    } catch {
      error('Failed to communicate with inventory service', 'Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        error(data.error || 'Cannot delete product', 'Integrity Protection');
        return;
      }

      success(`Product "${name}" deleted`);
      fetchProducts();
    } catch {
      error('Failed to delete product', 'Error');
    }
  };

  const openLocationInspect = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success) {
        setInspectProduct(data.data);
      }
    } catch {
      error('Failed to fetch location breakdown', 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-500" />
            <span>Product Inventory Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage SKUs, unit costs, pricing, and live per-rack warehouse distribution
          </p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, or description..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500/30"
            />
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">SKU</th>
                <th className="py-3 px-6">Product Details</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6 text-right">Selling Price</th>
                <th className="py-3 px-6 text-right">Cost Price</th>
                <th className="py-3 px-6 text-center">On-Hand Stock</th>
                <th className="py-3 px-6 text-right">Threshold</th>
                <th className="py-3 px-6 text-right">Asset Value</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-6 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-100">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {p.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-medium text-slate-200">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-400">
                      {formatCurrency(p.cost)}
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                          p.isLowStock
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {p.isLowStock && <AlertTriangle className="w-3 h-3 shrink-0" />}
                        <span>
                          {formatNumber(p.currentStock)} {p.unitOfMeasure}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-400">
                      {p.minStockThreshold} {p.unitOfMeasure}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.stockValue)}
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openLocationInspect(p.id)}
                          title="View Stock Breakdown per Location"
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditDrawer(p)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Stock per Location Breakdown */}
      <Modal
        isOpen={!!inspectProduct}
        onClose={() => setInspectProduct(null)}
        title={inspectProduct?.name || 'Stock Distribution'}
        subtitle={`SKU: ${inspectProduct?.sku} • Total Available: ${inspectProduct?.currentStock} ${inspectProduct?.unitOfMeasure}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Aggregate Valuation</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {formatCurrency(inspectProduct?.stockValue || 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Low Stock Reorder Alert</div>
              <div
                className={`text-xs font-bold mt-1 ${
                  inspectProduct?.isLowStock ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {inspectProduct?.isLowStock ? 'Alert Active (< Threshold)' : 'Optimal Levels'}
              </div>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider pt-2">
            Storage Location Inventory
          </h4>

          {inspectProduct?.locationsBreakdown && inspectProduct.locationsBreakdown.length > 0 ? (
            <div className="space-y-2">
              {inspectProduct.locationsBreakdown.map((loc) => (
                <div
                  key={loc.locationId}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{loc.locationName}</div>
                      <div className="text-[10px] text-slate-400">{loc.warehouseName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-blue-400">
                      {formatNumber(loc.quantity)} {inspectProduct.unitOfMeasure}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-850 rounded-xl">
              No on-hand units currently registered in any warehouse bay.
            </div>
          )}
        </div>
      </Modal>

      {/* Drawer: Add / Edit Product */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingProduct ? 'Edit Catalog Product' : 'Register New Product'}
        subtitle="Manage product specifications, SKU identifiers, and inventory thresholds"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Brushless Servo Motor 24V"
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                SKU Identifier *
              </label>
              {!editingProduct && (
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Generate SKU
                </button>
              )}
            </div>
            <input
              type="text"
              value={formSku}
              onChange={(e) => setFormSku(e.target.value)}
              placeholder="e.g. PRD-ELEC-009"
              disabled={!!editingProduct}
              className="w-full font-mono uppercase bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Unit of Measure (UoM)
            </label>
            <input
              type="text"
              value={formUom}
              onChange={(e) => setFormUom(e.target.value)}
              placeholder="pcs, box, kg, bundle..."
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                required
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Min Stock Reorder Threshold
            </label>
            <input
              type="number"
              min="0"
              value={formMinThreshold}
              onChange={(e) => setFormMinThreshold(e.target.value)}
              required
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Trigger automated low-stock warnings when inventory dips below this amount.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Engineering specs or warehouse handling notes..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
