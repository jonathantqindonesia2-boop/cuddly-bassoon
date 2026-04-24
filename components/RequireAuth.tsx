'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [router, user]);

  if (user === null) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  return <>{children}</>;
}
