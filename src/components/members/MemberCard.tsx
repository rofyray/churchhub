'use client';

import { Member } from '@/lib/types';
import { Card, Badge, Avatar } from '@/components/ui';
import { formatPhoneNumber } from '@/lib/utils/format';

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
}

export default function MemberCard({ member, onClick }: MemberCardProps) {
  const fullName = `${member.firstName} ${member.lastName}`;

  return (
    <Card
      variant="interactive"
      className="p-4"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      aria-label={`View details for ${fullName}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          src={member.photoUrl}
          name={fullName}
          size="lg"
          showBadge={member.flagged || member.absenceCount === 1}
          badgeColor={member.flagged ? "danger" : "warning"}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">
              {fullName}
            </h3>
            {(member.absenceCount ?? 0) >= 1 && (
              <Badge variant={member.flagged ? "danger" : "warning"} size="sm">
                {member.absenceCount} {member.absenceCount === 1 ? 'absence' : 'absences'}
              </Badge>
            )}
          </div>

          <p className="text-sm text-text-muted mt-1">
            {member.departmentName || 'No department'}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
            {member.phone && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{formatPhoneNumber(member.phone)}</span>
              </span>
            )}
            {member.email && (
              <span className="flex items-center gap-1.5 truncate">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{member.email}</span>
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  );
}
