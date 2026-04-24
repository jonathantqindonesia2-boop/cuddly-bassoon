'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import Toast from '@/components/Toast';

type ReportItem = {
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
  items: ReportItem[];
};

type Summary = {
  totalSales: number;
  totalProfit: number;
  count: number;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    const res = await fetch(`/api/reports?date=${date}`);
    const data = await res.json();
    setSummary(data.summary);
    setTransactions(data.transactions);
  };

  const totalItems = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.items.reduce((count, item) => count + item.quantity, 0), 0),
    [transactions]
  );

  const handleDelete = async (transactionId: number) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });
    setToast('Transaksi berhasil dihapus.');
    loadReport();
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[280px_1fr]">
          <Navbar />
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Laporan Harian</h2>
                  <p className="text-sm text-slate-500">Filter tanggal untuk melihat rekap penjualan dan profit.</p>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <ReportCard label="Total Penjualan" value={`Rp ${formatRupiah(summary?.totalSales ?? 0)}`} />
                <ReportCard label="Total Profit" value={`Rp ${formatRupiah(summary?.totalProfit ?? 0)}`} />
                <ReportCard label="Jumlah Transaksi" value={summary?.count ?? 0} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Detail Transaksi</h3>
                  <p className="text-sm text-slate-500">Total item hari ini: {totalItems}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Profit</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-4 w-60">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">
                          <ul className="space-y-1 text-slate-600">
                            {tx.items.map((item, idx) => (
                              <li key={idx}>
                                {item.productName} x{item.quantity} ({formatRupiah(item.price)})
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-4">Rp {tx.total.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">Rp {tx.profit.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">
                          {user?.role === 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(tx.id)}
                              className="rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100"
                            >
                              Hapus
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Hanya admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </RequireAuth>
  );
}

function ReportCard({ label, value }: { label: string; value: string | number }) {
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
