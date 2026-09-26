const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. src/components/ui/Toast.tsx
writeFile('src/components/ui/Toast.tsx', `'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (params: { type: ToastType; title?: string; message: string }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message }: { type: ToastType; title?: string; message: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
          let border = 'border-blue-500/30 bg-slate-900/95';

          if (t.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            border = 'border-emerald-500/30 bg-slate-900/95';
          } else if (t.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            border = 'border-rose-500/30 bg-slate-900/95';
          } else if (t.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            border = 'border-amber-500/30 bg-slate-900/95';
          }

          return (
            <div
              key={t.id}
              className={\`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 \${border}\`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1">
                {t.title && <div className="font-semibold text-sm text-slate-100">{t.title}</div>}
                <div className="text-xs text-slate-300 leading-relaxed mt-0.5">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}`);

// 2. src/components/ui/Badge.tsx
writeFile('src/components/ui/Badge.tsx', `import React from 'react';
import { DocStatus, DocType } from '@prisma/client';
import { getStatusBadge, getDocTypeBadge } from '@/lib/formatters';

export function StatusBadge({ status }: { status: DocStatus }) {
  const badge = getStatusBadge(status);
  return (
    <span
      className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border \${badge.bg} \${badge.text} \${badge.border}\`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
}

export function DocTypeBadge({ type }: { type: DocType }) {
  const badge = getDocTypeBadge(type);
  return (
    <span
      className={\`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border \${badge.bg}\`}
    >
      {badge.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: 'MANAGER' | 'STAFF' }) {
  const isManager = role === 'MANAGER';
  return (
    <span
      className={\`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider \${
        isManager
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      }\`}
    >
      {role}
    </span>
  );
}`);

// 3. src/components/ui/Modal.tsx
writeFile('src/components/ui/Modal.tsx', `'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={\`w-full \${maxWidthMap[maxWidth]} bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]\`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850/50">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}`);

// 4. src/components/ui/Drawer.tsx
writeFile('src/components/ui/Drawer.tsx', `'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'xl',
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthMap = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={\`w-full \${widthMap[width]} h-full bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out\`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-850">
          <div>
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}`);

// 5. src/components/layout/Sidebar.tsx
writeFile('src/components/layout/Sidebar.tsx', `'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History,
  Warehouse,
  UserCircle,
  Boxes,
} from 'lucide-react';
import { UserSession } from '@/types';
import { RoleBadge } from '../ui/Badge';

interface SidebarProps {
  user: UserSession;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: 'Products & Stock',
      href: '/products',
      icon: Package,
      active: pathname.startsWith('/products'),
    },
    {
      label: 'Operations',
      href: '/operations',
      icon: ArrowLeftRight,
      active: pathname.startsWith('/operations'),
    },
    {
      label: 'Move History',
      href: '/move-history',
      icon: History,
      active: pathname.startsWith('/move-history'),
    },
    {
      label: 'Warehouses',
      href: '/settings',
      icon: Warehouse,
      active: pathname.startsWith('/settings'),
    },
    {
      label: 'User Profile',
      href: '/profile',
      icon: UserCircle,
      active: pathname.startsWith('/profile'),
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-glow">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight">StockSense</h1>
          <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Modular Monolith</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 \${
                item.active
                  ? 'bg-blue-600 text-white shadow-glow font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }\`}
            >
              <Icon className={\`w-5 h-5 \${item.active ? 'text-white' : 'text-slate-400'}\`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
        <div className="overflow-hidden pr-2">
          <div className="text-xs font-semibold text-slate-200 truncate">{user.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
        </div>
        <RoleBadge role={user.role} />
      </div>
    </aside>
  );
}`);

// 6. src/components/layout/Topbar.tsx
writeFile('src/components/layout/Topbar.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { UserSession } from '@/types';
import Link from 'next/link';

interface TopbarProps {
  user: UserSession;
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          StockSense v1.0 • Enterprise
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setQuickOpen(!quickOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Operation</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {quickOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-850 border border-slate-700/80 shadow-2xl p-1.5 z-40"
              onClick={() => setQuickOpen(false)}
            >
              <Link
                href="/operations?tab=receipts&action=new"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Receive Inbound Stock</span>
              </Link>
              <Link
                href="/operations?tab=deliveries&action=new"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-rose-400 transition"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Dispatch Delivery Order</span>
              </Link>
              <Link
                href="/operations?tab=transfers&action=new"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Internal Transfer</span>
              </Link>
              <Link
                href="/operations?tab=adjustments&action=new"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-purple-400 transition"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Cycle Count Adjustment</span>
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase()}</div>
            </div>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-850 border border-slate-700/80 shadow-2xl p-1.5 z-40"
              onClick={() => setMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-bold text-slate-200 truncate">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}`);

// 7. src/components/layout/DashboardShell.tsx
writeFile('src/components/layout/DashboardShell.tsx', `import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserSession } from '@/types';

interface DashboardShellProps {
  user: UserSession;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}`);

console.log('Done UI components');
