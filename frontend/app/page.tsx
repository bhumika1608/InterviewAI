import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Mic,
  PenTool,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Waves,
} from 'lucide-react';

const featureCards = [
  {
    icon: Bot,
    title: 'Resume-aware AI questions',
    description: 'Questions adapt to your resume, experience, projects, and interview role.',
  },
  {
    icon: TrendingUp,
    title: 'Adaptive difficulty',
    description: 'The interviewer continuously adjusts the challenge based on your score and accuracy.',
  },
  {
    icon: Mic,
    title: 'Voice-first interviews',
    description: 'Practice with text, voice, or voice plus camera modes for a realistic simulation.',
  },
  {
    icon: BarChart3,
    title: 'Performance analytics',
    description: 'Review your metrics, weak topics, and confidence growth across interviews.',
  },
];

const interviewTypes = ['Technical', 'HR', 'Behavioral', 'Resume-based', 'Mixed'];

const stats = [
  { label: 'Interviews simulated', value: '12.4K+' },
  { label: 'Average improvement', value: '18%' },
  { label: 'Free & local first', value: '100%' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="container-shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-200">
              AI
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">InterviewAI</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-violet-700">How it works</a>
            <a href="#features" className="transition hover:text-violet-700">Features</a>
            <a href="#types" className="transition hover:text-violet-700">Interview types</a>
            <a href="#analytics" className="transition hover:text-violet-700">Analytics</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary hidden sm:inline-flex">
              Login
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Start Interview
            </Link>
          </div>
        </div>
      </header>

      <section className="container-shell py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              AI mock interview simulator
            </div>

            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              Practice Interviews. <span className="gradient-title">Build Confidence.</span> Get Better.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              An AI-powered mock interview simulator that adapts to your resume, answers and performance.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/interview/setup" className="btn-primary">
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Interview
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                <Target className="mr-2 h-5 w-5" />
                Try Demo
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm">
                  <p className="text-2xl font-black text-violet-700">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 blur-3xl" />
            <div className="card-surface relative overflow-hidden p-6 md:p-8">
              <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">AI Interviewer</p>
                      <p className="font-semibold">Rhea</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                    Listening
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <p className="text-sm text-slate-400">Current question</p>
                  <p className="mt-3 text-lg font-medium leading-8 text-slate-50">
                    “Can you walk me through a project where you used React and explain the design decisions behind it?”
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Role</p>
                    <p className="mt-2 font-semibold">Frontend Developer</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Difficulty</p>
                    <p className="mt-2 font-semibold">Adaptive</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm">
                  <div className="flex items-center gap-2 text-violet-200">
                    <Waves className="h-4 w-4" />
                    Voice + text mode
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    AI online
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-900 py-20 text-white">
        <div className="container-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">How it works</p>
            <h2 className="mt-4 text-3xl font-bold md:text-5xl">From resume upload to interview report in one flow</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              'Upload your resume',
              'Choose interview settings',
              'Answer live questions',
              'Get insights and coaching',
            ].map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-lg font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="container-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Key features</p>
            <h2 className="mt-4 text-3xl font-bold md:text-5xl">Built for real interview preparation</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card-surface p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="types" className="bg-white py-20">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Interview types</p>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl">Train for the role you want</h2>
              <p className="mt-5 max-w-lg text-slate-600">
                Practice with technical, HR, behavioral, resume-based, and mixed interviews tailored to your target role and experience.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {interviewTypes.map((type, index) => (
                <div key={type} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
                    {index + 1}
                  </div>
                  <p className="text-lg font-semibold">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="bg-gradient-to-b from-violet-50 to-white py-20">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="card-surface p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Performance analytics</p>
                  <h3 className="mt-3 text-2xl font-bold">Track progress over time</h3>
                </div>
                <TrendingUp className="h-8 w-8 text-violet-600" />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Technical', value: '86%' },
                  { label: 'Communication', value: '81%' },
                  { label: 'Concept coverage', value: '78%' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">AI evaluation</p>
              <h3 className="mt-3 text-2xl font-bold">Smart, actionable feedback</h3>
              <ul className="mt-6 space-y-4 text-slate-600">
                {['Relevance', 'Technical depth', 'Clarity', 'Concept coverage'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-shell">
          <div className="card-surface flex flex-col items-center justify-between gap-6 px-6 py-8 text-center md:flex-row md:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Final CTA</p>
              <h3 className="mt-3 text-3xl font-bold">Practice with confidence before your next interview.</h3>
            </div>
            <Link href="/dashboard" className="btn-primary">
              Try the platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-slate-600 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
              AI
            </div>
            <span className="font-semibold text-slate-800">InterviewAI</span>
          </div>
          <p>Built for local interview readiness and practical MCA project work.</p>
        </div>
      </footer>
    </main>
  );
}
