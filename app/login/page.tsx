'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const message = await login(username, password);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Kelontong Manager</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Masuk ke dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Gunakan akun admin atau kasir untuk melihat fitur.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="admin atau user"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="admin123 atau user123"
              required
            />
          </div>

          {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            disabled={loading}
          >
            {loading ? 'Memeriksa ...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Akun demo:</p>
          <p>Admin: admin / admin123</p>
          <p>Kasir: user / user123</p>
        </div>
      </div>
    </main>
  );
}
