'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import Toast from '@/components/Toast';

type Product = {
  id: number;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const lowStock = useMemo(() => products.filter((product) => product.stock < 5).length, [products]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const res = await fetch('/api/products');
    if (!res.ok) {
      setError('Gagal memuat produk.');
      return;
    }
    const data = await res.json();
    setProducts(data);
  };

  const resetForm = () => {
    setName('');
    setCategory('Makanan');
    setCostPrice('');
    setSellingPrice('');
    setStock('');
    setSelected(null);
    setError(null);
  };

  const validate = () => {
    if (!name.trim() || costPrice.trim() === '' || sellingPrice.trim() === '' || stock.trim() === '') {
      return 'Semua input wajib diisi.';
    }
    if (Number(costPrice) < 0 || Number(sellingPrice) < 0 || Number(stock) < 0) {
      return 'Harga dan stok tidak boleh negatif.';
    }
    if (Number(sellingPrice) < Number(costPrice)) {
      return 'Harga jual harus lebih besar atau sama dengan harga beli.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock)
    };

    const endpoint = selected ? `/api/products/${selected.id}` : '/api/products';
    const method = selected ? 'PATCH' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || 'Gagal menyimpan produk.');
      return;
    }

    setToast(selected ? 'Produk berhasil diupdate.' : 'Produk berhasil ditambahkan.');
    resetForm();
    setProducts((current) => [data, ...current]);
    await loadProducts();
  };

  const handleEdit = (product: Product) => {
    setSelected(product);
    setName(product.name);
    setCategory(product.category);
    setCostPrice(String(product.costPrice));
    setSellingPrice(String(product.sellingPrice));
    setStock(String(product.stock));
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setToast('Produk berhasil dihapus.');
    loadProducts();
  };

  if (user?.role !== 'admin') {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
            <h1 className="text-2xl font-semibold text-slate-900">Akses terbatas</h1>
            <p className="mt-3 text-slate-500">Hanya admin yang dapat mengelola produk.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[280px_1fr]">
          <Navbar />
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Manajemen Barang</h2>
                  <p className="mt-1 text-sm text-slate-500">Input, sunting, dan hapus produk kelontong.</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Stok rendah: {lowStock}</div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nama Barang</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition duration-150 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    placeholder="Contoh: Sabun cuci"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Kategori</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition duration-150 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    <option>Minuman</option>
                    <option>Makanan</option>
                    <option>Peralatan</option>
                    <option>Perawatan</option>
                    <option>Lainnya</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Harga Beli</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition duration-150 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    min="0"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Harga Jual</span>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition duration-150 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    min="0"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Stok</span>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition duration-150 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    min="0"
                  />
                </label>

                <div className="sm:col-span-2">
                  {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200/30 transition hover:from-sky-700 hover:to-cyan-600"
                    >
                      {selected ? 'Update Produk' : 'Tambah Produk'}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Daftar Barang</h3>
                  <p className="text-sm text-slate-500">Semua produk dan status stok.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Harga Beli</th>
                      <th className="px-4 py-3">Harga Jual</th>
                      <th className="px-4 py-3">Stok</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4 font-medium text-slate-900">{product.name}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-4">Rp {formatRupiah(product.costPrice)}</td>
                        <td className="px-4 py-4">Rp {formatRupiah(product.sellingPrice)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.stock < 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4 space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="rounded-2xl border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100"
                          >
                            Hapus
                          </button>
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

function formatRupiah(value: number) {
  return value.toLocaleString('id-ID');
}
