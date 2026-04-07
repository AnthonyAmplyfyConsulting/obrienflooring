'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, LogOut } from 'lucide-react';
import Image from 'next/image';

const navigation = [
  { name: 'Leads List', href: '/leads', icon: Users },
  { name: 'Job Pipeline', href: '/pipeline', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-zinc-200">
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-zinc-100">
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
          <span className="text-xl font-bold text-zinc-900 tracking-tight">O'Brien</span>
        </div>
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
        <Link
          href="/login"
          className="flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <LogOut className="h-5 w-5 text-zinc-400" />
          Sign Out
        </Link>
      </div>
    </div>
  );
}
