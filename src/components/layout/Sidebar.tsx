'use client';

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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                item.active
                  ? 'bg-blue-600 text-white shadow-glow font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-slate-400'}`} />
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
}
