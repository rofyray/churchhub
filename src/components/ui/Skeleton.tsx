'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  className?: string;
}

const variantClasses = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
  card: 'rounded-xl',
};

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, className }, ref) => {
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
      <div
        ref={ref}
        className={cn('animate-pulse bg-white/10', variantClasses[variant], className)}
        style={style}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('p-4 rounded-xl bg-white/5 border border-white/10', className)}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rectangular" height="60px" className="mb-3" />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width="80px" height="32px" />
      <Skeleton variant="rectangular" width="80px" height="32px" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, className }: { count?: number; className?: string }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ className }: { className?: string }) => (
  <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
        <Skeleton variant="text" width="50%" className="mb-2" />
        <Skeleton variant="text" width="70%" height="24px" />
      </div>
    ))}
  </div>
);

export default Skeleton;
