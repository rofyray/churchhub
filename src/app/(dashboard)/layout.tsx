'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import Header from '@/components/layout/Header';
import TabNav from '@/components/layout/TabNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600/20 mb-4">
            <Spinner size="lg" />
          </div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex">
        <TabNav
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
        />

        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
