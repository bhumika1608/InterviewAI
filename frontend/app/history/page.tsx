'use client';

import { ArrowDownToLine, ArrowRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Interview = {
  id: number;
  title: string;
  profile: string;
  status: string;
  score: number | null;
  created_at: string;
  completed_at: string | null;
  summary: string;
};

function csvCell(value: string | number) {
  const safeValue = String(value).replace(/^\s*[=+\-@]/, "'$&");
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch('/interviews/history/');
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Unable to load interview history.');
        setInterviews(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load interview history.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const exportHistory = () => {
    const rows = [
      ['Profile', 'Date', 'Status', 'Score', 'Summary'],
      ...interviews.map((item) => [
        item.profile,
        new Date(item.created_at).toLocaleString(),
        item.status,
        item.score ?? '',
        item.summary,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'interview-history.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Your activity</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Interview history</h1>
          </div>
          <button type="button" onClick={exportHistory} disabled={!interviews.length} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </header>

        {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="border-y border-slate-200 bg-white" aria-label="Saved interviews">
          {loading ? (
            <p className="p-6 text-sm text-slate-600">Loading saved interviews...</p>
          ) : interviews.length ? (
            interviews.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 border-b border-slate-200 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-violet-600" />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{item.profile}</h2>
                    <p className="mt-1 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    {item.summary && <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-600">{item.summary}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-5 md:justify-end">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{item.score === null ? '--' : `${item.score}%`}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{item.status.replace('_', ' ')}</p>
                  </div>
                  {item.status === 'completed' && (
                    <Link href={`/interview/report?sessionId=${item.id}`} className="inline-flex items-center text-sm font-semibold text-violet-700">
                      Report <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-900">No interviews saved yet</p>
              <p className="mt-2 text-sm text-slate-500">Your completed sessions and reports will appear here.</p>
              <Link href="/interview/setup" className="btn-primary mt-5">Start an interview</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}