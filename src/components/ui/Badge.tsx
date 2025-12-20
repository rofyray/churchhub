'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
}

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-text-secondary',
    brand: 'bg-brand-600/20 text-brand-200',
    success: 'bg-green-500/20 text-green-300',
    warning: 'bg-amber-500/20 text-amber-300',
    danger: 'bg-red-500/20 text-red-300',
  };

  const dotColors = {
    default: 'bg-text-muted',
    brand: 'bg-brand-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
