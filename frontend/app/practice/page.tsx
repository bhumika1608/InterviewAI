'use client';

import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type RecommendedTopic = {
  name: string;
  progress: number;
};

export default function PracticePage() {
  const [topics, setTopics] = useState<RecommendedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPracticeData = async () => {
      try {
        const response = await apiFetch('/interviews/dashboard/');
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load practice recommendations.');

        const recommendations: string[] = data.recommendations?.length
          ? data.recommendations
          : ['Complete your first interview to unlock personalized practice topics'];

        const derivedTopics = recommendations.map((item: string, index: number) => ({
          name: item,
          progress: Math.max(25, Math.min(92, Math.round((data.average_score || 55) - (index * 9)))),
        }));

        setTopics(derivedTopics);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load practice recommendations.');
      } finally {
        setLoading(false);
      }
    };

    loadPracticeData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Practice mode</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Recommended topics</h1>
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="space-y-5">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-slate-600">Loading your personal practice recommendations...</div>
          ) : topics.map((topic) => (
            <div key={topic.name} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{topic.name}</p>
                    <p className="text-sm text-slate-500">Progress: {topic.progress}%</p>
                  </div>
                </div>

                <button className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700" type="button">
                  <Sparkles className="h-4 w-4" />
                  Start mini interview
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${topic.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
