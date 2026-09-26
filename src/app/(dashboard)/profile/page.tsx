'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, Shield, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { RoleBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { UserSession } from '@/types';

export default function ProfilePage() {
  const { error, success } = useToast();

  const [user, setUser] = useState<UserSession | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match', 'Validation Error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Password update failed', 'Error');
        setSubmitting(false);
        return;
      }

      success('Your security password has been updated', 'Success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      error('Failed to communicate with authentication service', 'Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <UserCircle className="w-6 h-6 text-blue-500" />
          <span>User Profile & Security</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review your access credentials and role-based permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-bold">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100">{user?.name || 'Active Operator'}</h3>
            <p className="text-xs text-slate-400">{user?.email || 'operator@stocksense.com'}</p>
          </div>

          <div className="pt-2">
            <div className="text-xs text-slate-400 mb-1.5 font-medium">System Role:</div>
            <RoleBadge role={user?.role || 'MANAGER'} />
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>Auth Mechanism: JWT / HTTP-Only Cookie</div>
            <div>OTP Protocol: Self-Contained 6-Digit Token</div>
            <div>Database: PostgreSQL 16</div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-400" />
            <span>Update Account Password</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Minimum 8 chars, 1 uppercase, 1 digit"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
              >
                {submitting ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role Capabilities Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Role-Based Access Control (RBAC) Matrix</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Capabilities partition between Inventory Managers and Logistics Staff
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Feature / Operation</th>
                <th className="py-2.5 px-4 text-center">Logistics Staff</th>
                <th className="py-2.5 px-4 text-center">Inventory Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-2.5 px-4">View KPI Dashboard & Stock Telemetry</td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Create & Validate Inbound Receipts</td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Create & Ship Customer Delivery Orders</td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Execute Internal Bin Transfers (Dual-Entry)</td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-4 text-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Cycle Count Adjustments & Variance Posting</td>
                <td className="py-2.5 px-4 text-center text-slate-500">—</td>
                <td className="py-2.5 px-4 text-center text-purple-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Catalog Product Deletion (With Ledger Guard)</td>
                <td className="py-2.5 px-4 text-center text-slate-500">—</td>
                <td className="py-2.5 px-4 text-center text-purple-400">
                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
