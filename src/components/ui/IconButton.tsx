'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  'aria-label': string; // Required for accessibility
}

const variants = {
  default: 'bg-white/10 hover:bg-white/20 text-text-primary border border-white/10',
  ghost: 'hover:bg-white/10 text-text-secondary hover:text-text-primary',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
};

const sizes = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

const iconSizes = {
  sm: '[&>svg]:w-4 [&>svg]:h-4',
  md: '[&>svg]:w-5 [&>svg]:h-5',
  lg: '[&>svg]:w-6 [&>svg]:h-6',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    icon,
    variant = 'default',
    size = 'md',
    loading = false,
    disabled,
    className,
    'aria-label': ariaLabel,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          iconSizes[size],
          className
        )}
        {...props}
      >
        {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
