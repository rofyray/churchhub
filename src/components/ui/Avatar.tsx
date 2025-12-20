'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
  badgeColor?: 'success' | 'warning' | 'danger' | 'brand';
}

const sizes = {
  xs: { container: 'w-6 h-6', text: 'text-xs', badge: 'w-2 h-2' },
  sm: { container: 'w-8 h-8', text: 'text-xs', badge: 'w-2.5 h-2.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', badge: 'w-3 h-3' },
  lg: { container: 'w-12 h-12', text: 'text-base', badge: 'w-3.5 h-3.5' },
  xl: { container: 'w-16 h-16', text: 'text-lg', badge: 'w-4 h-4' },
};

const badgeColors = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  brand: 'bg-brand-500',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name, size = 'md', className, showBadge, badgeColor = 'success' }, ref) => {
    const sizeConfig = sizes[size];
    const initials = getInitials(name);
    const displayAlt = alt || name || 'Avatar';

    return (
      <div ref={ref} className={cn('relative inline-flex', className)}>
        <div
          className={cn(
            sizeConfig.container,
            'rounded-full overflow-hidden flex items-center justify-center',
            'bg-brand-600/30 text-brand-200 font-medium ring-2 ring-white/10',
            sizeConfig.text
          )}
        >
          {src ? (
            <Image
              src={src}
              alt={displayAlt}
              fill
              className="object-cover"
              sizes="(max-width: 64px) 64px, 64px"
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        {showBadge && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-dark-secondary',
              sizeConfig.badge,
              badgeColors[badgeColor]
            )}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar group for showing multiple avatars
export function AvatarGroup({
  avatars,
  max = 3,
  size = 'md',
  className
}: {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-dark-secondary"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizes[size].container,
            'rounded-full flex items-center justify-center',
            'bg-white/10 text-text-secondary ring-2 ring-dark-secondary font-medium',
            sizes[size].text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
