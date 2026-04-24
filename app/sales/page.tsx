'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import Toast from '@/components/Toast';

type Product = {
  id: number;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
};

type CartItem = {
  productId: number;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
};

type Transaction = {
  id: number;
  total: number;
  profit: number;
  createdAt: string;
  items: { productName: string; quantity: number; price: number; profit: number }[];
};

export default function SalesPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  const loadProducts = async () => {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  };

  const loadHistory = async () => {
    const res = await fetch('/api/transactions');
    setHistory(await res.json());
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setError('Pilih produk terlebih dahulu.');
      return;
    }
    const qty = Number(quantity);
    if (quantity.trim() === '' || Number.isNaN(qty) || qty <= 0) {
      setError('Jumlah harus lebih besar dari 0.');
      return;
    }
    if (qty > selectedProduct.stock) {
      setError('Stok tidak cukup.');
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === selectedProduct.id);
      if (existing) {
        return current.map((item) =>
          item.productId === selectedProduct.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...current,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          costPrice: selectedProduct.costPrice,
          sellingPrice: selectedProduct.sellingPrice,
          quantity: qty
        }
      ];
    });
    setQuantity('1');
    setError(null);
    setToast('Item ditambahkan ke keranjang.');
  };

  const removeCartItem = (productId: number) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0), [cart]);
  const totalProfit = useMemo(
    () => cart.reduce((sum, item) => sum + (item.sellingPrice - item.costPrice) * item.quantity, 0),
    [cart]
  );

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Keranjang masih kosong.');
      return;
    }

    const payload = { items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })) };
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || 'Gagal menyimpan transaksi.');
      return;
    }

    setCart([]);
    setQuantity('1');
    loadProducts();
    loadHistory();
    setToast('Transaksi berhasil disimpan.');
    setError(null);
  };
  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Hapus riwayat transaksi ini?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    setToast('Riwayat transaksi dihapus.');
    loadProducts();
    loadHistory();
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[280px_1fr]">
          <Navbar />
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-slate-900 p-6 text-white shadow-2xl shadow-cyan-500/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold">Transaksi Penjualan</h2>
                    <p className="mt-2 max-w-2xl text-sm text-cyan-100">Pilih barang, tambah ke keranjang, dan simpan transaksi. Semua penjualan otomatis tersimpan dalam database.</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                    {user?.role === 'admin' ? 'Mode Admin' : 'Mode Kasir'}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Pilih Barang</span>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(Number(e.target.value))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900"
                      >
                        <option value={0}>Pilih produk...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - stok {product.stock}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Jumlah</span>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Harga jual:</p>
                      <p className="text-lg font-semibold text-slate-900">Rp {selectedProduct ? selectedProduct.sellingPrice.toLocaleString('id-ID') : '0'}</p>
                      {selectedProduct ? (
                        <p className="mt-1 text-xs text-slate-500">Stok tersedia: {selectedProduct.stock}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/30 transition hover:from-emerald-700 hover:to-teal-600"
                    >
                      Tambah ke Keranjang
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-sm text-slate-500">Ringkasan Keranjang</p>
                  <div className="mt-4 space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-sm text-slate-500">Keranjang kosong.</p>
                    ) : (
                      cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 px-4 py-3 shadow-sm shadow-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.quantity} x Rp {item.sellingPrice.toLocaleString('id-ID')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Hapus
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-5 rounded-3xl bg-slate-100 px-5 py-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Total Harga</span>
                      <strong className="text-slate-900">Rp {totalAmount.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>Total Profit</span>
                      <strong className="text-slate-900">Rp {totalProfit.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompleteSale}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-300/20 transition hover:from-fuchsia-700 hover:to-pink-600"
                  >
                    Selesaikan Transaksi
                  </button>
                  {error ? <p className="mt-3 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Riwayat Transaksi</h3>
                  <p className="text-sm text-slate-500">Transaksi terbaru disimpan otomatis.</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Profit</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {history.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-4 w-56">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">Rp {tx.total.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">Rp {tx.profit.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4">
                          <ul className="space-y-1">
                            {tx.items.map((item, index) => (
                              <li key={index} className="text-slate-600">
                                {item.productName} x{item.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-4">
                          {user?.role === 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
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
