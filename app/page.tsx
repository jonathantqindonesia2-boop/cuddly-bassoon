'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';

type Product = {
  id: number;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
};

type TransactionItem = {
  productName: string;
  quantity: number;
  price: number;
  profit: number;
};

type Transaction = {
  id: number;
  createdAt: string;
  total: number;
  profit: number;
  items: TransactionItem[];
};

type ProductSummary = {
  productName: string;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    async function load(date: string) {
      const reportRes = await fetch(`/api/reports?date=${date}`);
      const summaryData = await reportRes.json();
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();

      setSummary({
        totalSales: summaryData.summary.totalSales,
        totalProfit: summaryData.summary.totalProfit,
        transactionCount: summaryData.summary.count,
        lowStockCount: productsData.filter((item: Product) => item.stock < 5).length,
        totalStock: productsData.reduce((sum: number, item: Product) => sum + item.stock, 0)
      });
      setProducts(productsData);
      setTransactions(summaryData.transactions);

      const productMap = summaryData.transactions.reduce((acc: Record<string, ProductSummary>, tx: Transaction) => {
        tx.items.forEach((item) => {
          if (!acc[item.productName]) {
            acc[item.productName] = {
              productName: item.productName,
              totalSold: 0,
              totalRevenue: 0,
              totalProfit: 0
            };
          }
          acc[item.productName].totalSold += item.quantity;
          acc[item.productName].totalRevenue += item.price * item.quantity;
          acc[item.productName].totalProfit += item.profit;
        });
        return acc;
      }, {});

      setProductSummaries(Object.values(productMap));
    }

    load(selectedDate);
  }, [selectedDate]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[280px_1fr]">
          <Navbar />

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
                  <p className="mt-1 text-sm text-slate-500">Ringkasan penjualan dan stok untuk tanggal yang dipilih.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                  <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Hai, {user?.role === 'admin' ? 'Admin' : 'Kasir'}!</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card label="Total stok" value={summary?.totalStock ?? 0} />
                <Card label="Barang hampir habis" value={summary?.lowStockCount ?? 0} />
                <Card label="Penjualan" value={`Rp ${formatRupiah(summary?.totalSales ?? 0)}`} />
                <Card label="Profit" value={`Rp ${formatRupiah(summary?.totalProfit ?? 0)}`} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Ringkasan Per Produk</h3>
                  <p className="text-sm text-slate-500">Jumlah terjual, pendapatan, dan profit per produk pada tanggal yang dipilih.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Total Terjual</th>
                      <th className="px-4 py-3">Pendapatan</th>
                      <th className="px-4 py-3">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {productSummaries.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-slate-500" colSpan={4}>Tidak ada penjualan untuk tanggal ini.</td>
                      </tr>
                    ) : (
                      productSummaries.map((summaryItem) => (
                        <tr key={summaryItem.productName}>
                          <td className="px-4 py-4 font-medium text-slate-900">{summaryItem.productName}</td>
                          <td className="px-4 py-4">{summaryItem.totalSold}</td>
                          <td className="px-4 py-4">Rp {formatRupiah(summaryItem.totalRevenue)}</td>
                          <td className="px-4 py-4">Rp {formatRupiah(summaryItem.totalProfit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Database Produk & Transaksi</h3>
                  <p className="text-sm text-slate-500">Semua data produk dan riwayat transaksi yang tersimpan di database.</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Gunakan untuk analisa dan evaluasi</div>
              </div>

              <div className="space-y-6">
                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Nama Produk</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Harga Beli</th>
                        <th className="px-4 py-3">Harga Jual</th>
                        <th className="px-4 py-3">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-4 w-16 text-slate-600">{product.id}</td>
                          <td className="px-4 py-4 font-medium text-slate-900">{product.name}</td>
                          <td className="px-4 py-4 text-slate-600">{product.category}</td>
                          <td className="px-4 py-4">Rp {formatRupiah(product.costPrice)}</td>
                          <td className="px-4 py-4">Rp {formatRupiah(product.sellingPrice)}</td>
                          <td className="px-4 py-4">{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Transaksi</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-4 w-24 text-slate-600">#{transaction.id}</td>
                          <td className="px-4 py-4 text-slate-600">{new Date(transaction.createdAt).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4 text-slate-600">
                            <div className="max-w-xs truncate text-slate-800">
                              {transaction.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-4">Rp {formatRupiah(transaction.total)}</td>
                          <td className="px-4 py-4">Rp {formatRupiah(transaction.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
