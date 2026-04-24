'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';

type Product = {
  id: number;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
};

type ReportSummary = {
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  lowStockCount: number;
  totalStock: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const reportRes = await fetch(`/api/reports?date=${today}`);
      const summaryData = await reportRes.json();
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();

      setSummary({
        totalSales: summaryData.totalSales,
        totalProfit: summaryData.totalProfit,
        transactionCount: summaryData.count,
        lowStockCount: productsData.filter((item: Product) => item.stock < 5).length,
        totalStock: productsData.reduce((sum: number, item: Product) => sum + item.stock, 0)
      });
      setProducts(productsData.slice(0, 5));
    }

    load();
  }, []);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[280px_1fr]">
          <Navbar />

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
                  <p className="mt-1 text-sm text-slate-500">Ringkasan penjualan dan stok hari ini.</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Hai, {user?.role === 'admin' ? 'Admin' : 'Kasir'}!</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card label="Total stok" value={summary?.totalStock ?? 0} />
                <Card label="Barang hampir habis" value={summary?.lowStockCount ?? 0} />
                <Card label="Penjualan hari ini" value={`Rp ${formatRupiah(summary?.totalSales ?? 0)}`} />
                <Card label="Profit hari ini" value={`Rp ${formatRupiah(summary?.totalProfit ?? 0)}`} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Stok teratas</h3>
                  <p className="text-sm text-slate-500">Produk dengan stok terbesar saat ini.</p>
                </div>
              </div>

              <div className="space-y-3">
                {products.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada produk.</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">Harga Jual: Rp {formatRupiah(product.sellingPrice)}</p>
                      </div>
                      <span className="rounded-2xl bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{product.stock}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatRupiah(value: number) {
  return value.toLocaleString('id-ID');
}
