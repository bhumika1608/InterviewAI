 'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
 import { apiFetch } from '../../lib/api';

 export default function RegisterPage() {
   const router = useRouter();
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (event: FormEvent) => {
     event.preventDefault();
     setLoading(true);
     setError('');
     try {
       const response = await apiFetch('/users/register/', {
         method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to create account.');
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white">
            AI
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-600">Join and start building interview confidence.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200" placeholder="Your name" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200" placeholder="Create a strong password" />
          </div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating account...' : 'Register'}</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-violet-700">Login</Link>
        </div>
      </div>
    </main>
  );
}
