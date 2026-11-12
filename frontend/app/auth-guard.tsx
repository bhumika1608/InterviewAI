'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '../components/app-shell';
import { apiFetch } from '../lib/api';

const publicPaths = ['/', '/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    let active = true;
    if (isPublicPath) {
      setReady(true);
      return;
    }

    setReady(false);
    const verifySession = async () => {
      try {
        const response = await apiFetch('/users/me/');
        if (!response.ok) throw new Error('Session expired.');
        const currentUser = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (active) setReady(true);
      } catch {
        localStorage.removeItem('currentUser');
        if (active) router.replace('/login');
      }
    };

    verifySession();
    return () => {
      active = false;
    };
  }, [isPublicPath, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
        <p role="status" className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
          Checking your session...
        </p>
      </main>
    );
  }

  if (isPublicPath || pathname === '/interview') return children;
  return <AppShell>{children}</AppShell>;
}
