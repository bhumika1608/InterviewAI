'use client';

import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';

type ScoreEntry = {
  date: string;
  score: number;
  profile: string;
};

type DashboardData = {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  best_score: number;
  recommendations: string[];
  score_history: ScoreEntry[];
};

export default function ProgressPage() {
  const [data, setData] = useState<DashboardData>({
    total_interviews: 0,
    completed_interviews: 0,
    average_score: 0,
    best_score: 0,
    recommendations: [],
    score_history: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await apiFetch('/interviews/dashboard/');
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Unable to load your progress.');
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your progress.');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  const maxScore = useMemo(() => Math.max(100, ...data.score_history.map((item) => item.score), 0), [data.score_history]);
  const scoreDelta = data.score_history.length > 1
    ? Math.round(data.score_history[data.score_history.length - 1].score - data.score_history[0].score)
    : 0;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Progress analytics</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Your learning trajectory</h1>
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Score over time</p>
                <p className="mt-2 text-2xl font-bold">
                  {loading ? 'Loading your scores...' : `Improved by ${Math.max(0, scoreDelta)}% in ${data.total_interviews || 0} interviews`}
                </p>
              </div>
              <TrendingUp className="h-7 w-7 text-violet-300" />
            </div>

            <div className="flex h-52 items-end gap-3">
              {data.score_history.length ? (
                data.score_history.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                    <div className="w-full rounded-t-2xl bg-gradient-to-t from-violet-500 to-indigo-500" style={{ height: `${Math.max(12, (item.score / maxScore) * 100)}%` }} />
                    <span className="text-xs text-slate-400">{index + 1}</span>
                  </div>
                ))
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-400">
                  No interview scores yet. Complete your first practice to start tracking progress.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-violet-700" />
              <h2 className="text-2xl font-bold text-slate-900">Insights</h2>
            </div>
            <ul className="mt-5 space-y-4 text-slate-700">
              <li className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-500" /> Average score: {data.average_score || 0}%</li>
              <li className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-500" /> Best score: {data.best_score || 0}%</li>
              <li className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-500" /> {data.recommendations.length ? `Priority focus: ${data.recommendations[0]}` : 'No new recommendations yet'}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
