'use client';

import React, { useState } from 'react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { UserSession } from '@/types';
import Link from 'next/link';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  user: UserSession;
}

export function Topbar({ user }: TopbarProps) {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          StockSense v1.0 • Enterprise
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Operations Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickOpen(!quickOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
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

        {/* User Menu */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
