'use client';

import {
  ChartColumn,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Mic,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/interview/setup', label: 'New interview', icon: Mic },
  { href: '/history', label: 'Interview history', icon: History },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/progress', label: 'Progress', icon: ChartColumn },
  { href: '/practice', label: 'Practice', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: UserRound },
] as const;

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountName, setAccountName] = useState('Your account');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setAccountName(user.email || user.username || 'Your account');
    } catch {
      setAccountName('Your account');
    }
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiFetch('/users/logout/', { method: 'POST' });
    } catch {
      // Clear the local session even if the API is offline.
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastSessionId');
      router.replace('/login');
      router.refresh();
    }
  };

  const currentLabel = pathname.startsWith('/interview/report')
    ? 'Interview report'
    : navigation.find((item) => isActiveRoute(pathname, item.href))?.label ?? 'InterviewAI';

  return (
    <div className="min-h-screen bg-[#eef1eb] text-[#183b34] md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#183f37] px-4 py-5 text-white md:flex">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2" aria-label="InterviewAI overview">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d9ef75] text-lg font-black text-[#183f37]">IA</span>
          <span>
            <span className="block font-bold tracking-tight">InterviewAI</span>
            <span className="block text-xs text-white/60">Practice workspace</span>
          </span>
        </Link>

        <p className="mb-2 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-[#d9ef75] text-[#183f37]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-4">
          <p className="truncate px-3 text-xs text-white/60">{accountName}</p>
          <button type="button" onClick={logout} disabled={loggingOut} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60">
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out...' : 'Log out'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#d8dfd5] bg-[#f8faf6]/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d9ef75] text-sm font-black text-[#183f37]">IA</span>
              <span className="font-bold text-[#183f37]">InterviewAI</span>
            </div>
            <p className="hidden text-sm font-semibold text-[#31554b] md:block">{currentLabel}</p>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden max-w-56 truncate text-sm text-[#63776e] sm:block">{accountName}</span>
              <button type="button" onClick={logout} disabled={loggingOut} aria-label="Log out" title="Log out" className="inline-flex items-center gap-2 rounded-lg border border-[#cdd6cb] bg-[#f8faf6] px-3 py-2 text-sm font-semibold text-[#31554b] transition hover:bg-white disabled:opacity-60 md:hidden">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 md:hidden" aria-label="Mobile navigation">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActiveRoute(pathname, href);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-[#183f37] text-white' : 'text-[#526960] hover:bg-[#e7ebdf]'}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}