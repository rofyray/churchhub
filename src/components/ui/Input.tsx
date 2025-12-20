'use client';

import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id: providedId, required, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText && !error ? `${id}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              // Base: explicit height, width, typography
              'h-12 w-full text-base leading-normal',
              // Appearance: reset browser defaults
              'appearance-none bg-white/5 text-white',
              // Border + radius
              'border border-white/10 rounded-xl',
              // Spacing: consistent padding (pl-14 for icon to prevent overlap)
              icon ? 'pl-14 pr-4' : 'px-4',
              // Placeholder
              'placeholder:text-text-placeholder',
              // States
              'hover:border-white/20',
              'focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Transition
              'transition-colors duration-200',
              // Error state
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            aria-required={required}
            required={required}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
