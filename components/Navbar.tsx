'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, Home, ShoppingCart, ClipboardList, Box } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-full bg-white shadow-soft p-4 rounded-3xl border border-slate-200">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-[0.3em]">Kelontong App</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manajemen Toko</h1>
        </div>

        <div className="space-y-2">
          <NavLink href="/" active={pathname === '/'} icon={Home} label="Dashboard" />
          <NavLink href="/sales" active={pathname === '/sales'} icon={ShoppingCart} label="Penjualan" />
          <NavLink href="/reports" active={pathname === '/reports'} icon={ClipboardList} label="Laporan" />
          {user?.role === 'admin' && <NavLink href="/products" active={pathname === '/products'} icon={Box} label="Produk" />}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">Signed in as</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-slate-900 capitalize">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Kasir'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ href, active, icon: Icon, label }: { href: string; active: boolean; icon: typeof Home; label: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}
