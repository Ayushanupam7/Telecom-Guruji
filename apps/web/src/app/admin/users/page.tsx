'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, Shield, UserCheck, Check, Search } from 'lucide-react';
import { UserRole } from '@signalhub/types';

interface DemoUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  language: string;
  joined: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DemoUserRecord[]>([
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      email: 'instructor@signalhub.app',
      fullName: 'Dr. Alex Rivera',
      role: 'instructor',
      language: 'en',
      joined: '2026-08-13',
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      email: 'student@signalhub.app',
      fullName: 'Priya Sharma',
      role: 'student',
      language: 'hi',
      joined: '2026-08-13',
    },
    {
      id: 'c9999999-9999-9999-9999-999999999999',
      email: 'admin@signalhub.app',
      fullName: 'Lead Admin / Developer',
      role: 'admin',
      language: 'en',
      joined: '2026-08-13',
    },
  ]);

  const [search, setSearch] = useState('');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    alert(`User role updated to ${newRole.toUpperCase()}`);
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
          User & Role Governance
        </span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Users & RBAC Roles</h1>
          <p className="text-xs text-slate-400 mt-1">Manage user permissions, escalate student accounts to instructors, or grant admin rights.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : u.role === 'instructor'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase">{u.language}</td>
                  <td className="px-4 py-3 text-slate-400">{u.joined}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
