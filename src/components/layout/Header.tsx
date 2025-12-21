'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Avatar, IconButton } from '@/components/ui';

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const { adminData, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-glass-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Logo and Menu button */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <IconButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            }
            onClick={onMenuClick}
            variant="ghost"
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isSidebarOpen}
            aria-controls="main-navigation"
            className="lg:hidden"
          />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center" aria-hidden="true">
              <svg
                className="w-5 h-5 text-brand-400"
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
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-white">Church Hub</h1>
            </div>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">
                {adminData?.name || 'Admin'}
              </p>
              <p className="text-xs text-text-muted">{adminData?.email}</p>
            </div>
            <Avatar
              name={adminData?.name}
              src={adminData?.photoUrl}
              size="md"
            />
          </div>

          {/* Sign out button */}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
