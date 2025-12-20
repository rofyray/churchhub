'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 mb-4 animate-pulse">
          <svg
            className="w-8 h-8 text-brand-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white">Church Hub</h1>
        <p className="text-slate-400 mt-2">Loading...</p>
      </div>
    </div>
  );
}
