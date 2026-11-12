'use client';

import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import { apiFetch } from '../../../lib/api';

const questionCounts = [3, 5, 8];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setResumeFile(file);

    if (file.type.includes('text') || file.name.toLowerCase().endsWith('.txt')) {
      const text = await file.text();
      setResumeText(text);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!resumeFile && !resumeText.trim()) {
      setError('Upload a readable resume or paste your resume text to continue.');
      return;
    }
    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append('question_count', String(count));
      if (resumeText) {
        payload.append('resume_text', resumeText);
      }
      if (resumeFile) {
        payload.append('resume', resumeFile);
      }

      const response = await apiFetch('/interviews/create/', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to start interview.');
      }

      localStorage.setItem('lastSessionId', String(data.session_id));
      router.push(`/interview?sessionId=${data.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the interview.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Interview setup</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Start with your resume</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
            <Sparkles className="h-4 w-4" />
            Resume-led interview
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Your resume</label>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} className="mb-3 block w-full text-sm text-slate-600" />
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="Or paste the full resume text"
              />
            </div>

            <div className="max-w-xs">
              <label className="mb-3 block text-sm font-semibold text-slate-700">Questions</label>
              <select value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200">
                {questionCounts.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Preparing interview...' : 'Start Interview'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">
                Back to dashboard
              </button>
            </div>
            {isLoading && (
              <p role="status" className="text-sm text-slate-500">
                Analyzing your resume and preparing questions. The first request may take a little longer while the local AI warms up.
              </p>
            )}
          </form>

          <aside className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Personalized from your resume</p>
            <p className="mt-5 text-lg font-semibold">Your field and interview topics are inferred from your own experience, education, and projects.</p>
            <div className="mt-4 space-y-3">
              {[
                'Resume-specific questions',
                'Questions spoken aloud',
                'Microphone starts automatically',
                'Camera analysis when available',
              ].map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
