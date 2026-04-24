'use client';

import { useEffect } from 'react';

export default function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-3xl border border-slate-200 bg-slate-950 px-5 py-4 text-sm text-white shadow-soft">
      {message}
    </div>
  );
}
