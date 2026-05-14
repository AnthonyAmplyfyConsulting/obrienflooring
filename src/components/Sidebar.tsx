'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, CheckSquare, LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { logout } from '@/app/actions/auth';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Leads List', href: '/leads', icon: Users },
  { name: 'Job Pipeline', href: '/pipeline', icon: LayoutDashboard },
  { name: 'Completed Jobs', href: '/completed', icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-zinc-100 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-emerald-50 flex items-center justify-center p-1 border border-emerald-100">
            <Image
              src="/logo.png"
              alt="O'Brien Flooring Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-zinc-900 tracking-tight">O&apos;Brien</span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-zinc-100">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <LogOut className="h-5 w-5 text-zinc-400" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-4 shadow-sm">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-emerald-50 flex items-center justify-center p-0.5 border border-emerald-100">
            <Image
              src="/logo.png"
              alt="O'Brien Flooring Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold text-zinc-900 tracking-tight">O&apos;Brien</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 flex flex-col bg-white shadow-2xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col bg-white border-r border-zinc-200">
        {sidebarContent}
      </div>
    </>
  );
}
