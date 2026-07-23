"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, BarChart3, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col flex-1">
      {/* Admin Header & Navigation */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-accent" />
              Admin Panel
            </h1>
            <p className="text-gray-400 mt-1">Manage users, orders, and view store analytics.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto hide-scrollbar">
          <Link 
            href="/7evenejoyer" 
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${pathname === '/7evenejoyer' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
          >
            <Users className="w-4 h-4" />
            Users & Balances
          </Link>
          <Link 
            href="/7evenejoyer/analytics" 
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${pathname?.startsWith('/7evenejoyer/analytics') ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
