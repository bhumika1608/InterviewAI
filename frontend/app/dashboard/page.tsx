'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, ChartColumn, FileText, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

type Interview = {
  id: number;
  title: string;
  profile: string;
  status: string;
  score: number | null;
  created_at: string;
};

type DashboardData = {
  total_interviews: number;
  completed_interviews: number;
  active_sessions: number;
  average_score: number;
  best_score: number;
  total_resumes: number;
  skill_count: number;
  score_history: { date: string; score: number; profile: string }[];
  latest_interview: Interview | null;
  recent_interviews: Interview[];
  recommendations: string[];
};

const emptyDashboard: DashboardData = {
  total_interviews: 0,
  completed_interviews: 0,
  active_sessions: 0,
  average_score: 0,
  best_score: 0,
  total_resumes: 0,
  skill_count: 0,
  score_history: [],
  latest_interview: null,
  recent_interviews: [],
  recommendations: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch('/interviews/dashboard/');
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Unable to load your interview dashboard.');
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your interview dashboard.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = [
    { label: 'Interviews', value: data.total_interviews, note: `${data.completed_interviews} completed` },
    { label: 'Average score', value: `${data.average_score}%`, note: 'Completed sessions only' },
    { label: 'Best score', value: `${data.best_score}%`, note: `${data.active_sessions} in progress` },
    { label: 'Resume profiles', value: data.total_resumes, note: `${data.skill_count} unique skills found` },
  ];
  const maxScore = Math.max(100, ...data.score_history.map((item) => item.score));

  return (
    <main className="min-h-screen bg-[#eef1eb] px-4 py-7 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-5 border-b border-[#d1d8ce] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c34f35]">Interview practice / Overview</p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-[#183b34]">Your progress, in focus.</h1>
          </div>

          <div className="flex gap-3">
            <Link href="/history" className="inline-flex items-center rounded-lg border border-[#cdd6cb] bg-[#f8faf6] px-4 py-2.5 text-sm font-semibold text-[#28453e] transition hover:bg-white">History</Link>
            <Link href="/interview/setup" className="inline-flex items-center rounded-lg bg-[#183f37] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#225348] focus:outline-none focus:ring-2 focus:ring-[#c9e66c]">
              New interview <ArrowRight className="ml-2 h-4 w-4 text-[#d9ef75]" />
            </Link>
          </div>
        </header>

        {error && <p className="mb-6 rounded-lg border border-[#e6bdb2] bg-[#fff3ef] px-4 py-3 text-sm text-[#963d2b]">{error}</p>}

        {loading ? (
          <div className="min-h-36 animate-pulse rounded-xl border border-[#d7ded3] bg-[#f8faf6] p-6 text-sm text-[#536760]">Loading your interview data...</div>
        ) : (
          <>
            <section className="grid overflow-hidden rounded-xl border border-[#d6ddd2] bg-[#f9fbf7] sm:grid-cols-2 xl:grid-cols-4" aria-label="Interview statistics">
              {metrics.map((item) => (
                <article key={item.label} className="border-b border-[#e0e5dd] px-5 py-4 last:border-b-0 sm:border-r sm:px-6 xl:border-b-0 xl:last:border-r-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6a7d73]">{item.label}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-3xl font-bold tabular-nums text-[#183b34]">{item.value}</span>
                    <TrendingUp className="h-4 w-4 text-[#c34f35]" />
                  </div>
                  <p className="mt-1 text-xs text-[#75847c]">{item.note}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="overflow-hidden rounded-xl bg-[#183f37] p-5 text-white md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d9ef75]">Score history</p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-white">Completed interviews</h2>
                  </div>
                  <ChartColumn className="h-6 w-6 text-[#d9ef75]" />
                </div>
                {data.score_history.length ? (
                  <div className="flex min-h-52 items-end gap-3 border-b border-white/20 pb-3">
                    {data.score_history.map((item, index) => (
                      <div key={`${item.date}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <span className="text-xs font-bold tabular-nums text-white">{Math.round(item.score)}%</span>
                        <div className="flex h-36 w-full items-end overflow-hidden rounded-t-md bg-white/10">
                          <div className="w-full rounded-t-md bg-[#d9ef75] transition-[height] duration-500" style={{ height: `${Math.max(4, item.score / maxScore * 100)}%` }} />
                        </div>
                        <span className="max-w-full truncate text-center text-[11px] text-white/70">{item.profile}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-52 flex-col items-center justify-center border-t border-white/15 text-center">
                    <TrendingUp className="h-7 w-7 text-[#d9ef75]" />
                    <p className="mt-3 font-semibold text-white">Your score history starts here</p>
                    <p className="mt-1 text-sm text-white/65">Complete an interview to see your progress.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-[#d6ddd2] bg-[#f9fbf7] p-5 md:p-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c34f35]">Latest session</p>
                {data.latest_interview ? (
                  <div className="mt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-[#183b34]">{data.latest_interview.profile}</h2>
                        <p className="mt-1 text-sm text-[#718078]">{new Date(data.latest_interview.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-[#e8eddf] px-3 py-1 text-xs font-bold capitalize text-[#31554b]">{data.latest_interview.status.replace('_', ' ')}</span>
                    </div>
                    {data.latest_interview.score !== null && <p className="mt-5 text-4xl font-bold tabular-nums text-[#183f37]">{data.latest_interview.score}<span className="text-xl">%</span></p>}
                  </div>
                ) : (
                  <div className="mt-5">
                    <FileText className="h-6 w-6 text-[#8a9a90]" />
                    <p className="mt-3 font-semibold text-[#183b34]">No interviews yet</p>
                    <p className="mt-1 text-sm text-[#718078]">Your sessions and saved reviews will appear here.</p>
                  </div>
                )}
                </div>
                {data.latest_interview?.status === 'completed' && (
                  <Link href={`/interview/report?sessionId=${data.latest_interview.id}`} className="mt-5 inline-flex w-fit items-center rounded-lg bg-[#d9ef75] px-4 py-2.5 text-sm font-bold text-[#183b34] transition hover:bg-[#e4f59b]">
                    Open saved report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-[#d6ddd2] bg-[#f9fbf7] p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c34f35]">Your activity</p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#183b34]">Recent interviews</h2>
                  </div>
                  <CalendarDays className="h-5 w-5 text-[#c34f35]" />
                </div>
                {data.recent_interviews.length ? (
                  <div className="divide-y divide-[#e1e6de]">
                    {data.recent_interviews.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-[#203d36]">{item.profile}</p>
                          <p className="mt-1 text-sm text-[#75847c]">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold capitalize tabular-nums text-[#31554b]">{item.score === null ? item.status.replace('_', ' ') : `${item.score}%`}</span>
                          {item.status === 'completed' && <Link className="text-sm font-bold text-[#c34f35] hover:underline" href={`/interview/report?sessionId=${item.id}`}>Report</Link>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm text-[#718078]">Completed and in-progress interviews will be listed here.</p>
                )}
              </div>

              <div className="rounded-xl bg-[#e3eaa9] p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#c34f35]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a6402c]">From your AI reviews</p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#183b34]">Practice next</h2>
                  </div>
                </div>
                {data.recommendations.length ? (
                  <ul className="mt-5 space-y-3">
                    {data.recommendations.map((item, index) => <li key={`${item}-${index}`} className="border-l-2 border-[#c34f35] pl-3 text-sm leading-6 text-[#31554b]">{item}</li>)}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-[#526960]">Personalized suggestions will appear after your first completed interview.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
