'use client';

import { ArrowLeft, CheckCircle2, CircleAlert, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ReportContent() {
  const params = useSearchParams();
  const sessionId = params.get('sessionId');
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/interviews/${sessionId}/`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load the interview report.');
        setReport(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unable to load the interview report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  const review = report?.evaluation_data?.review;
  const camera = report?.evaluation_data?.camera_observations;
  const questions = report?.questions ?? [];
  const answeredCount = questions.filter((question: any) => question.is_answered).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Interview report</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Performance summary</h1>
          </div>
          <Link href="/dashboard" className="btn-secondary inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">AI-evaluated answer average</p>
            <div className="mt-5 flex items-center gap-4">
              <span className="text-5xl font-black text-violet-300">{report?.overall_score ?? 0}%</span>
              <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                {report?.status === 'completed' ? 'Interview complete' : 'Review in progress'}
              </div>
            </div>
            <p className="mt-5 leading-7 text-slate-300">{review?.summary ?? report?.summary ?? (loading ? 'Loading your review...' : 'No AI review is available for this session.')}</p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p>Answers reviewed: <span className="font-semibold text-white">{answeredCount} / {questions.length}</span></p>
              <p>Face visible in analyzed frames: <span className="font-semibold text-white">{camera?.face_visibility_percent ?? 0}%</span></p>
              <p>Facing the camera: <span className="font-semibold text-white">{camera?.camera_facing_percent ?? 0}%</span></p>
              <p>Additional faces detected: <span className="font-semibold text-white">{camera?.multiple_face_frames ?? 0} frames</span></p>
              <p>Spoken answer captured: <span className="font-semibold text-white">{report?.voice_verified ? 'Yes' : 'No'}</span></p>
              <p>Tab left during interview: <span className="font-semibold text-white">{camera?.focus_changes ?? 0} times</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-violet-700" />
                <h2 className="text-2xl font-bold text-slate-900">What went well</h2>
              </div>
              <ul className="mt-5 space-y-3 text-slate-700">
                {(review?.strengths ?? []).map((item: string, index: number) => (
                  <li key={`${item}-${index}`} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> {item}</li>
                ))}
              </ul>
              {!loading && !review?.strengths?.length && <p className="mt-4 text-sm text-slate-500">No strengths were returned for this session.</p>}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <CircleAlert className="h-6 w-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-slate-900">Mistakes and improvements</h2>
              </div>
              <ul className="mt-5 space-y-3 text-slate-700">
                {[...(review?.mistakes ?? []), ...(review?.improvements ?? [])].map((item: string, index: number) => (
                  <li key={`${item}-${index}`} className="flex items-center gap-3"><CircleAlert className="h-5 w-5 shrink-0 text-amber-500" /> {item}</li>
                ))}
              </ul>
              {!loading && !review?.mistakes?.length && !review?.improvements?.length && <p className="mt-4 text-sm text-slate-500">No improvement notes were returned for this session.</p>}
            </div>
          </div>
        </section>

        {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold text-slate-900">Question-by-question feedback</h2>
          <div className="mt-5 space-y-4">
            {questions.map((question: any) => (
              <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{question.question_text}</h3>
                  <span className="shrink-0 text-sm font-bold text-violet-700">{question.score}%</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{question.user_answer || 'No answer recorded.'}</p>
                {question.evaluation && (
                  <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Mistakes</p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                        {question.evaluation.mistakes.map((item: string, index: number) => <li key={`${item}-${index}`}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Suggested improvements</p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                        {question.evaluation.improvements.map((item: string, index: number) => <li key={`${item}-${index}`}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </article>
            ))}
            {!loading && questions.length === 0 && <p className="text-sm text-slate-500">No question feedback is available.</p>}
          </div>
        </section>

        {!!review?.next_steps?.length && (
          <section className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">Practice next</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
              {review.next_steps.map((step: string, index: number) => <li key={`${step}-${index}`}>{step}</li>)}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100 p-10 text-slate-900">Loading report...</main>}>
      <ReportContent />
    </Suspense>
  );
}
