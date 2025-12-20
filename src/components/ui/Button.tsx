'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30',
      secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
      ghost: 'hover:bg-white/10 text-text-secondary hover:text-white',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',     // 36px
      md: 'h-12 px-4 text-base',  // 48px - matches Input
      lg: 'h-14 px-6 text-lg',    // 56px
    };

    const spinnerSizes = {
      sm: 'sm' as const,
      md: 'sm' as const,
      lg: 'md' as const,
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner size={spinnerSizes[size]} />}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
