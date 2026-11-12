import './globals.css';
import type { Metadata } from 'next';
import AuthGuard from './auth-guard';
import ThemeToggle from '../components/theme-toggle';

export const metadata: Metadata = {
  title: 'InterviewAI',
  description: 'AI mock interview simulator for technical and HR interviews.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeToggle />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
