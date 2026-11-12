'use client';

import { FileText, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type ResumeDetails = {
  id?: number;
  file_name?: string;
  summary?: string;
  skills?: string[];
  education?: string;
  experience_years?: number;
};

export default function ResumePage() {
  const [resume, setResume] = useState<ResumeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await apiFetch('/resumes/summary/');
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load your resume profile.');
        setResume(data.latest_resume ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your resume profile.');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, []);

  const skillText = resume?.skills?.length ? resume.skills.join(', ') : 'No skills detected yet';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Resume analysis</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Your resume profile</h1>
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.75rem] border border-dashed border-violet-300 bg-violet-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Upload className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">Resume overview</h2>
            <p className="mt-3 text-slate-600">
              {loading ? 'Loading your latest resume details...' : resume?.file_name ? `Last uploaded: ${resume.file_name}` : 'Upload a resume to personalize your interview flow.'}
            </p>
            <button className="btn-primary mt-6" type="button" onClick={() => window.location.href = '/interview/setup'}>Upload or update</button>
          </section>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Detected profile</p>
                <p className="font-semibold text-slate-900">{resume?.summary ? 'Resume profile ready' : 'No resume yet'}</p>
              </div>
            </div>

            <div className="mt-6 space-y-5 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Skills</p>
                <p className="mt-2">{skillText}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Experience</p>
                <p className="mt-2">{resume?.experience_years ? `${resume.experience_years} years` : 'Not yet analyzed'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Education</p>
                <p className="mt-2">{resume?.education || 'No education details captured yet'}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
