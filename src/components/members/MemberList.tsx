'use client';

import { useState, useMemo } from 'react';
import { Member, Department } from '@/lib/types';
import { Input, Select, SkeletonList, NoSearchResults, NoMembers } from '@/components/ui';
import MemberCard from './MemberCard';

interface MemberListProps {
  members: Member[];
  departments: Department[];
  loading?: boolean;
  onMemberClick?: (member: Member) => void;
  onAddMember?: () => void;
}

export default function MemberList({
  members,
  departments,
  loading,
  onMemberClick,
  onAddMember,
}: MemberListProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower) ||
        member.phone?.includes(search) ||
        member.email?.toLowerCase().includes(searchLower);

      // Department filter
      const matchesDept = !deptFilter || member.departmentId === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [members, search, deptFilter]);

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const handleClearSearch = () => {
    setSearch('');
    setDeptFilter('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filter skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          aria-label="Search members by name, phone, or email"
        />
        <Select
          options={departmentOptions}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Filter by department"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted">
        Showing {filteredMembers.length} of {members.length} members
      </p>

      {/* Members grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={() => onMemberClick?.(member)}
            />
          ))}
        </div>
      ) : search || deptFilter ? (
        <NoSearchResults
          searchTerm={search}
          onClear={handleClearSearch}
        />
      ) : (
        <NoMembers onAdd={onAddMember} />
      )}
    </div>
  );
}
