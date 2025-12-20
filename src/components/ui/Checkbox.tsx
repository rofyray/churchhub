'use client';

import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className={cn('flex items-start', className)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={cn(
              'w-4 h-4 rounded bg-white/5 border border-white/20 text-brand-600',
              'focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-0',
              'checked:bg-brand-600 checked:border-brand-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors cursor-pointer appearance-none relative',
              "before:content-[''] before:absolute before:inset-0",
              "before:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27white%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%27%2F%3E%3C%2Fsvg%3E')]",
              'before:bg-center before:bg-no-repeat before:opacity-0',
              'checked:before:opacity-100 before:transition-opacity'
            )}
            aria-describedby={descriptionId || errorId}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled ? 'text-text-muted' : 'text-text-primary'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={descriptionId} className="text-sm text-text-muted mt-0.5">
                {description}
              </p>
            )}
            {error && (
              <p id={errorId} className="text-sm text-red-400 mt-0.5">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
