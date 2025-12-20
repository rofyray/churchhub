'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'stat' | 'hover' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', as: Component = 'div', children, ...props }, ref) => {
    const baseStyles = 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl';

    const variants = {
      default: '',
      stat: 'hover:border-white/20 transition-colors',
      hover: 'hover:border-brand-500/30 hover:bg-white/[0.08] transition-all',
      interactive: 'hover:border-brand-500/30 hover:bg-white/[0.08] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <Component
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        tabIndex={variant === 'interactive' ? 0 : undefined}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header sub-component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// Card Title sub-component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, className, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component className={cn('text-lg font-semibold text-text-primary', className)}>
      {children}
    </Component>
  );
}

// Card Description sub-component
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-text-muted mt-1', className)}>
      {children}
    </p>
  );
}

// Card Content sub-component
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

// Card Footer sub-component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10', className)}>
      {children}
    </div>
  );
}

export default Card;
