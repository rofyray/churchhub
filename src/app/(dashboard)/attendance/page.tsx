'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMembersWithAbsenceCounts, getAttendanceByDate, saveAttendance } from '@/lib/firebase/firestore';
import { Button, Input, Card, Badge, useToast } from '@/components/ui';
import { Member } from '@/lib/types';

export default function AttendancePage() {
  const { adminData } = useAuth();
  const { success, error: showError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, { present: boolean; note?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const churchId = adminData?.churchId || '';

  // Load members and attendance for selected date
  useEffect(() => {
    async function loadData() {
      if (!churchId) return;

      setLoading(true);
      try {
        const [membersList, attendanceRecord] = await Promise.all([
          getMembersWithAbsenceCounts(churchId),
          getAttendanceByDate(churchId, selectedDate),
        ]);

        setMembers(membersList);

        // Initialize attendance state
        const initialAttendance: Record<string, { present: boolean; note?: string }> = {};
        membersList.forEach((member) => {
          if (attendanceRecord?.records?.[member.id]) {
            initialAttendance[member.id] = attendanceRecord.records[member.id];
          } else {
            initialAttendance[member.id] = { present: false };
          }
        });
        setAttendance(initialAttendance);
        setHasChanges(false);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [churchId, selectedDate]);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const searchLower = search.toLowerCase();
    return members.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchLower) ||
        m.departmentName?.toLowerCase().includes(searchLower)
    );
  }, [members, search]);

  // Stats
  const stats = useMemo(() => {
    const present = Object.values(attendance).filter((a) => a.present).length;
    const absent = Object.values(attendance).filter((a) => !a.present).length;
    return { present, absent, total: present + absent };
  }, [attendance]);

  const toggleAttendance = (memberId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], present: !prev[memberId]?.present },
    }));
    setHasChanges(true);
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, { present: boolean }> = {};
    members.forEach((m) => {
      newAttendance[m.id] = { present: true };
    });
    setAttendance(newAttendance);
    setHasChanges(true);
  };

  const markAllAbsent = () => {
    const newAttendance: Record<string, { present: boolean }> = {};
    members.forEach((m) => {
      newAttendance[m.id] = { present: false };
    });
    setAttendance(newAttendance);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!churchId) return;

    setSaving(true);
    try {
      await saveAttendance(churchId, selectedDate, attendance);
      setHasChanges(false);
      success('Attendance saved successfully');
    } catch (err) {
      console.error('Error saving attendance:', err);
      showError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-400 mt-1">Mark attendance for church members</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            Save
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-slate-400">Total</p>
        </Card>
        <Card className="p-4 text-center bg-green-500/5 border-green-500/20">
          <p className="text-3xl font-bold text-green-400">{stats.present}</p>
          <p className="text-sm text-slate-400">Present</p>
        </Card>
        <Card className="p-4 text-center bg-red-500/5 border-red-500/20">
          <p className="text-3xl font-bold text-red-400">{stats.absent}</p>
          <p className="text-sm text-slate-400">Absent</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={markAllPresent}>
            Mark All Present
          </Button>
          <Button variant="secondary" size="sm" onClick={markAllAbsent}>
            Mark All Absent
          </Button>
        </div>
      </div>

      {/* Member List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const isPresent = attendance[member.id]?.present || false;

            return (
              <Card
                key={member.id}
                className={`p-4 cursor-pointer transition-all ${
                  isPresent
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'hover:bg-white/5'
                }`}
                onClick={() => toggleAttendance(member.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isPresent
                        ? 'bg-green-500 border-green-500'
                        : 'border-white/30'
                    }`}
                  >
                    {isPresent && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand-300">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">
                        {member.firstName} {member.lastName}
                      </p>
                      {member.flagged && (
                        <Badge variant="danger" size="sm">
                          {member.absenceCount ?? 2} {(member.absenceCount ?? 2) === 1 ? 'absence' : 'absences'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {member.departmentName || 'No department'}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge variant={isPresent ? 'success' : 'default'}>
                    {isPresent ? 'Present' : 'Absent'}
                  </Badge>
                </div>
              </Card>
            );
          })}

          {filteredMembers.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-400">No members found</p>
            </Card>
          )}
        </div>
      )}

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto">
          <Card className="p-4 bg-amber-500/10 border-amber-500/30 flex items-center gap-4">
            <svg
              className="w-5 h-5 text-amber-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-amber-200 text-sm">You have unsaved changes</p>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save Now
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
