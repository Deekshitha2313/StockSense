'use client';

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
}
