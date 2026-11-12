'use client';

import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type UserProfile = {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type ResumeSummary = {
  total_resumes?: number;
  total_skills?: number;
  latest_resume?: {
    summary?: string;
    skills?: string[];
    education?: string;
  } | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>({});
  const [resumeSummary, setResumeSummary] = useState<ResumeSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userResponse, resumeResponse] = await Promise.all([
          apiFetch('/users/me/'),
          apiFetch('/resumes/summary/'),
        ]);

        const userData = await userResponse.json();
        const resumeData = await resumeResponse.json();

        if (!userResponse.ok) throw new Error(userData.detail || 'Unable to load your profile.');
        if (!resumeResponse.ok) throw new Error(resumeData.detail || 'Unable to load your resume summary.');

        setUser(userData);
        setResumeSummary(resumeData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User';
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
  const summary = resumeSummary.latest_resume?.summary || 'No resume summary available yet. Upload a resume to get a personalized profile summary.';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl font-black text-white">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Profile</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{loading ? 'Loading profile...' : fullName}</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-900">Contact details</h2>
            <div className="mt-5 space-y-4 text-slate-700">
              <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-violet-700" /> {user.email || 'No email available'}</div>
              <div className="flex items-center gap-3"><span className="h-5 w-5 text-violet-700">#</span> {resumeSummary.total_resumes ?? 0} resumes uploaded</div>
              <div className="flex items-center gap-3"><span className="h-5 w-5 text-violet-700">★</span> {resumeSummary.total_skills ?? 0} skills detected</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-900">Summary</h2>
            <p className="mt-4 text-slate-700">{summary}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
