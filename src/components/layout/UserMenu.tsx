'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, UserCircle } from 'lucide-react';
import { UserSession } from '@/types';
import { RoleBadge } from '../ui/Badge';

interface UserMenuProps {
  user: UserSession;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
        aria-label="User navigation menu"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
          {user.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
          <div className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase()}</div>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-850 border border-slate-700/80 shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-100"
          onClick={() => setIsOpen(false)}
        >
          <div className="px-3 py-2 border-b border-slate-800 mb-1.5">
            <div className="text-xs font-bold text-slate-200 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
            <div className="mt-2">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <UserCircle className="w-4 h-4 text-blue-400" />
            <span>Account Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition mt-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
