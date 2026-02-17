'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats, initializeDepartments, deduplicateDepartments } from '@/lib/firebase/firestore';
import StatsCards from '@/components/dashboard/StatsCards';
import Charts from '@/components/dashboard/Charts';
import { Card, CardHeader, CardTitle, Badge, useToast, Input, Select } from '@/components/ui';
import { Member } from '@/lib/types';

interface DashboardData {
  totalMembers: number;
  totalDepartments: number;
  presentMTD: number;
  absentMTD: number;
  ytdWelfare: number;
  genderDistribution: { male: number; female: number };
  membersByDepartment: Record<string, number>;
  membershipGrowth: Record<string, number>;
  flaggedMembers: Member[];
}

export default function DashboardPage() {
  const { adminData } = useAuth();
  const { error: showError } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [absenceFilter, setAbsenceFilter] = useState<string | null>(null);
  const [nameSearch, setNameSearch] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    async function loadDashboard() {
      if (!adminData?.churchId) return;

      try {
        // Initialize departments if needed, then deduplicate any duplicates
        await initializeDepartments(adminData.churchId);
        await deduplicateDepartments(adminData.churchId);

        // Load dashboard stats
        const stats = await getDashboardStats(adminData.churchId);
        setData(stats);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [adminData?.churchId, showError]);

  // Generate filter options from actual absence counts in the dataset
  // This hook must be before any early returns to satisfy Rules of Hooks
  const filterOptions = useMemo(() => {
    if (!data || data.flaggedMembers.length === 0) return [];

    // Get unique absence counts from the dataset, sorted descending
    const uniqueCounts = [...new Set(
      data.flaggedMembers.map((m) => m.absenceCount ?? 0)
    )].sort((a, b) => b - a);

    // Add "All" option first, then individual counts
    return [
      { value: 'all', label: 'All absences' },
      ...uniqueCounts.map((count) => ({
        value: count.toString(),
        label: `${count} ${count === 1 ? 'absence' : 'absences'}`,
      })),
    ];
  }, [data]);

  // Filter flagged members based on exact absence count and name search
  const filteredMembers = useMemo(() => {
    if (!data) return [];

    // Default to 'all' if no filter selected
    const effectiveFilter = absenceFilter ?? 'all';

    return data.flaggedMembers
      .filter((member) => {
        if (effectiveFilter === 'all') return true;
        return (member.absenceCount ?? 0) === Number(effectiveFilter);
      })
      .filter((member) => {
        if (!nameSearch.trim()) return true;
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        return fullName.includes(nameSearch.toLowerCase());
      })
      .sort((a, b) => (b.absenceCount ?? 0) - (a.absenceCount ?? 0));
  }, [data, absenceFilter, nameSearch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-slate-400">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-400">No data available</p>
      </Card>
    );
  }

  // Prepare chart data
  const departmentData = Object.entries(data.membersByDepartment).map(([department, count]) => ({
    department,
    count,
  }));

  // Extract available years from membership growth data
  const availableYears = [...new Set(
    Object.keys(data.membershipGrowth).map(key => key.split('-')[0])
  )].sort().reverse();

  // If selected year is not in available years, default to most recent
  const effectiveYear = availableYears.includes(selectedYear) ? selectedYear : (availableYears[0] || new Date().getFullYear().toString());

  // Calculate cumulative growth data for selected year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const growthData: { month: string; count: number }[] = [];

  // Get sorted list of all months with member joins
  const sortedMonths = Object.keys(data.membershipGrowth).sort();

  // Generate data for all 12 months of the selected year
  for (let month = 0; month < 12; month++) {
    const monthKey = `${effectiveYear}-${String(month + 1).padStart(2, '0')}`;
    const monthName = monthNames[month];

    // Count all members who joined up to and including this month
    let cumulativeCount = 0;
    sortedMonths.forEach(key => {
      if (key <= monthKey) {
        cumulativeCount += data.membershipGrowth[key];
      }
    });

    growthData.push({ month: monthName, count: cumulativeCount });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalMembers={data.totalMembers}
        presentMTD={data.presentMTD}
        absentMTD={data.absentMTD}
        ytdWelfare={data.ytdWelfare}
      />

      {/* Charts */}
      <Charts
        genderData={data.genderDistribution}
        growthData={growthData}
        departmentData={departmentData}
        selectedYear={effectiveYear}
        availableYears={availableYears}
        onYearChange={setSelectedYear}
      />

      {/* Flagged Members Alert */}
      {data.flaggedMembers.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <CardTitle>Members Requiring Attention</CardTitle>
              <Badge variant="warning">{data.flaggedMembers.length}</Badge>
            </div>
          </CardHeader>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={absenceFilter ?? 'all'}
                onChange={(e) => setAbsenceFilter(e.target.value)}
                options={filterOptions}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-amber-300">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-slate-400">{member.departmentName}</p>
                    </div>
                  </div>
                  <Badge variant="danger" size="sm">
                    {member.absenceCount ?? 0} {(member.absenceCount ?? 0) === 1 ? 'absence' : 'absences'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No members match the current filters
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="Add Member"
          description="Register a new church member"
          href="/members?action=add"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <QuickActionCard
          title="Mark Attendance"
          description="Record today's attendance"
          href="/attendance"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <QuickActionCard
          title="Record Welfare"
          description="Add a new welfare entry"
          href="/finance?action=add"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <QuickActionCard
          title="View Reports"
          description="Generate PDF reports"
          href="/settings"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickActionCard({ title, description, href, icon }: QuickActionCardProps) {
  return (
    <a href={href}>
      <Card variant="hover" className="p-4 group">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-600/20 rounded-xl text-brand-400 group-hover:bg-brand-600/30 transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </a>
  );
}
