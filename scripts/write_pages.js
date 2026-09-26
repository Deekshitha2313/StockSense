const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. src/app/globals.css
writeFile('src/app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --border: 217 33% 17%;
}

body {
  color: #f8fafc;
  background-color: #0b1120;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0f172a;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}`);

// 2. src/app/layout.tsx
writeFile('src/app/layout.tsx', `import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'StockSense | Enterprise Inventory Management System',
  description: 'Production-grade modular monolith inventory management and immutable stock ledger.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}`);

// 3. src/app/(dashboard)/layout.tsx
writeFile('src/app/(dashboard)/layout.tsx', `import React from 'react';
import { requireAuth } from '@/modules/auth/session';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return <DashboardShell user={session}>{children}</DashboardShell>;
}`);

// 4. src/app/(dashboard)/page.tsx
writeFile('src/app/(dashboard)/page.tsx', `import React from 'react';
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
                      style={{ width: \`\${Math.max(pct, 4)}%\` }}
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
                      className={\`font-mono font-bold \${
                        e.quantityDelta > 0
                          ? 'text-emerald-400'
                          : e.quantityDelta < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }\`}
                    >
                      {e.quantityDelta > 0 ? \`+\${e.quantityDelta}\` : e.quantityDelta}
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
}`);

// 5. src/app/(auth)/login/page.tsx
writeFile('src/app/(auth)/login/page.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { error, success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        error(data.error || 'Invalid credentials', 'Login Failed');
        setLoading(false);
        return;
      }

      success(\`Welcome back, \${data.user?.name}!\`, 'Authentication Successful');
      router.push('/');
      router.refresh();
    } catch {
      error('An unexpected connection error occurred.', 'Network Error');
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-glow mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">StockSense</h1>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to your enterprise inventory portal</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@stocksense.com"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 shadow-glow transition duration-150 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to StockSense</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center font-medium mb-3">
              Evaluation 1-Click Demo Logins:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('manager@stocksense.com')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('staff@stocksense.com')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Logistics Staff</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
            Register new account
          </Link>
        </p>
      </div>
    </div>
  );
}`);

// 6. src/app/(auth)/register/page.tsx
writeFile('src/app/(auth)/register/page.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boxes, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { error, success } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'MANAGER'>('STAFF');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        error(data.error || 'Registration failed', 'Registration Error');
        setLoading(false);
        return;
      }

      success(\`Account created for \${data.user?.name}!\`, 'Welcome to StockSense');
      router.push('/');
      router.refresh();
    } catch {
      error('An unexpected connection error occurred.', 'Network Error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-glow mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1.5">Join the StockSense inventory platform</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@stocksense.com"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 chars, 1 uppercase, 1 digit"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Access Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={\`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer \${
                    role === 'STAFF'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-glow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }\`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Logistics Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MANAGER')}
                  className={\`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer \${
                    role === 'MANAGER'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-glow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }\`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Inventory Manager</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 shadow-glow transition duration-150 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}`);

// 7. src/app/(auth)/reset-password/page.tsx
writeFile('src/app/(auth)/reset-password/page.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boxes, Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { error, success } = useToast();

  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to generate reset OTP', 'Error');
        setLoading(false);
        return;
      }

      setSimulatedOtp(data.otp);
      setStep('VERIFY');
      success('OTP generated successfully. Check the simulated preview banner.', 'OTP Dispatched');
      setLoading(false);
    } catch {
      error('Failed to communicate with authentication server', 'Connection Error');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Failed to reset password', 'Reset Failed');
        setLoading(false);
        return;
      }

      success('Your password has been updated. Please sign in.', 'Password Reset Success');
      router.push('/login');
    } catch {
      error('Failed to communicate with authentication server', 'Connection Error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-glow mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Security Reset</h1>
          <p className="text-sm text-slate-400 mt-1.5">Reset your credential with one-time verification token</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          {step === 'REQUEST' ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@stocksense.com"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 shadow-glow transition cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Generate Reset OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {simulatedOtp && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-blue-300">Simulated Gateway Token</div>
                    <div className="text-sm font-mono font-bold text-white tracking-widest mt-0.5">
                      {simulatedOtp}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      (Generated without external cloud SMS dependency for evaluation independence)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  6-Digit OTP Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full font-mono bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 shadow-glow-emerald transition cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}`);

console.log('Done pages');
