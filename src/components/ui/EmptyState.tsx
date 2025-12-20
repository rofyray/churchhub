'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

// Default icons for common empty states
const DefaultIcons = {
  search: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  users: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  document: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  folder: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="mb-4 p-4 rounded-full bg-white/5">
        {icon || DefaultIcons.folder}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Preset empty states for common use cases
export function NoSearchResults({ searchTerm, onClear }: { searchTerm?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={DefaultIcons.search}
      title="No results found"
      description={searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your search or filters'}
      action={
        onClear && (
          <button
            onClick={onClear}
            className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
          >
            Clear search
          </button>
        )
      }
    />
  );
}

export function NoMembers({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={DefaultIcons.users}
      title="No members yet"
      description="Get started by adding your first church member"
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Add Member
          </button>
        )
      }
    />
  );
}

export function NoData({ title = 'No data', description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={DefaultIcons.document}
      title={title}
      description={description}
    />
  );
}

export default EmptyState;
