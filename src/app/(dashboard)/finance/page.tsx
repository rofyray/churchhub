'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMembers, getWelfare, createWelfareEntry, deleteWelfareEntry, getDepartments } from '@/lib/firebase/firestore';
import { Button, Input, Select, SearchableSelect, Card, Modal, Badge, useToast } from '@/components/ui';
import { Member, WelfareRecord, Department } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export default function FinancePage() {
  const { adminData } = useAuth();
  const { success, error: showError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [welfareEntries, setWelfareEntries] = useState<WelfareRecord[]>([]);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<WelfareRecord | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showOverallStats, setShowOverallStats] = useState(false);

  const churchId = adminData?.churchId || '';

  // Compute the month string for API calls (format: YYYY-MM)
  const selectedMonthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Month options (fixed list)
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Year options (1990 to currentYear+10, newest first for easy access)
  const yearOptions = useMemo(() => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const startYear = 1990;
    const endYear = currentYear + 10;
    for (let year = endYear; year >= startYear; year--) {
      options.push({ value: String(year), label: String(year) });
    }
    return options;
  }, []);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!churchId) return;

      setLoading(true);
      try {
        const [membersList, welfareList, departmentsList] = await Promise.all([
          getMembers(churchId),
          getWelfare(churchId, selectedMonthString),
          getDepartments(churchId),
        ]);
        setMembers(membersList);
        setWelfareEntries(welfareList);
        setDepartments(departmentsList);
      } catch (err) {
        console.error('Error loading data:', err);
        showError('Failed to load finance data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [churchId, selectedMonthString]);

  // Filter welfare entries by department (client-side)
  const filteredWelfare = useMemo(() => {
    if (!selectedDepartment) return welfareEntries;

    // Get member IDs in selected department
    const deptMemberIds = new Set(
      members
        .filter((m) => m.departmentId === selectedDepartment)
        .map((m) => m.id)
    );

    // Filter welfare entries to only those from department members
    return welfareEntries.filter((t) => deptMemberIds.has(t.memberId));
  }, [welfareEntries, members, selectedDepartment]);

  // Get selected department name
  const selectedDepartmentName = useMemo(() => {
    if (!selectedDepartment) return '';
    return departments.find((d) => d.id === selectedDepartment)?.name || '';
  }, [selectedDepartment, departments]);

  // Stats (overall and department)
  const stats = useMemo(() => {
    // Overall stats (always from all welfare entries)
    const overallTotal = welfareEntries.reduce((sum, t) => sum + t.amount, 0);
    const overallCount = welfareEntries.length;
    const overallAverage = overallCount > 0 ? overallTotal / overallCount : 0;

    // Department stats (from filtered welfare entries)
    const deptTotal = filteredWelfare.reduce((sum, t) => sum + t.amount, 0);
    const deptCount = filteredWelfare.length;
    const deptAverage = deptCount > 0 ? deptTotal / deptCount : 0;

    return {
      overall: { total: overallTotal, count: overallCount, average: overallAverage },
      department: { total: deptTotal, count: deptCount, average: deptAverage },
    };
  }, [welfareEntries, filteredWelfare]);

  const handleAddWelfare = async (data: {
    memberId: string;
    amount: number;
    note: string;
  }) => {
    if (!churchId) return;

    const member = members.find((m) => m.id === data.memberId);
    if (!member) return;

    try {
      await createWelfareEntry(churchId, {
        memberId: data.memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        amount: data.amount,
        month: selectedMonthString,
        date: Timestamp.fromDate(new Date()),
        note: data.note,
      });

      // Refresh welfare entries
      const updatedWelfare = await getWelfare(churchId, selectedMonthString);
      setWelfareEntries(updatedWelfare);
      setShowAddModal(false);
      success('Welfare entry added successfully');
    } catch (err) {
      console.error('Error adding welfare entry:', err);
      showError('Failed to add welfare entry');
    }
  };

  const handleDeleteWelfare = async () => {
    if (!churchId || !showDeleteConfirm) return;

    try {
      await deleteWelfareEntry(churchId, showDeleteConfirm.id);

      // Refresh welfare entries
      const updatedWelfare = await getWelfare(churchId, selectedMonthString);
      setWelfareEntries(updatedWelfare);
      setShowDeleteConfirm(null);
      success('Welfare entry deleted');
    } catch (err) {
      console.error('Error deleting welfare entry:', err);
      showError('Failed to delete welfare entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-slate-400 mt-1">Track welfare and offerings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              options={monthOptions}
              value={String(selectedMonth)}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-36"
            />
            <Select
              options={yearOptions}
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-28"
            />
            <Select
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      {selectedDepartment ? (
        <>
          {/* Department Stats (shown first when department selected) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-purple-600/10 border-purple-500/20">
              <p className="text-sm text-slate-400">{selectedDepartmentName} Total</p>
              <p className="text-3xl font-bold text-white mt-1">
                GHS {stats.department.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-400">{selectedDepartmentName} Entries</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.department.count}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-400">{selectedDepartmentName} Average</p>
              <p className="text-3xl font-bold text-white mt-1">
                GHS {stats.department.average.toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Toggle for Overall Stats */}
          <button
            onClick={() => setShowOverallStats(!showOverallStats)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showOverallStats ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showOverallStats ? 'Hide Overall Stats' : 'Show Overall Stats'}
          </button>

          {/* Collapsible Overall Stats */}
          {showOverallStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-brand-600/10 border-brand-500/20">
                <p className="text-sm text-slate-400">Total This Month</p>
                <p className="text-3xl font-bold text-white mt-1">
                  GHS {stats.overall.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-slate-400">Number of Entries</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.overall.count}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-slate-400">Average Amount</p>
                <p className="text-3xl font-bold text-white mt-1">
                  GHS {stats.overall.average.toFixed(2)}
                </p>
              </Card>
            </div>
          )}
        </>
      ) : (
        /* Overall Stats (shown normally when no department selected) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-brand-600/10 border-brand-500/20">
            <p className="text-sm text-slate-400">Total This Month</p>
            <p className="text-3xl font-bold text-white mt-1">
              GHS {stats.overall.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-400">Number of Entries</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.overall.count}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-400">Average Amount</p>
            <p className="text-3xl font-bold text-white mt-1">
              GHS {stats.overall.average.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      {/* Welfare List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-32" />
                  <div className="h-3 bg-white/10 rounded w-24" />
                </div>
                <div className="h-6 bg-white/10 rounded w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredWelfare.length > 0 ? (
        <div className="space-y-2">
          {filteredWelfare.map((entry) => (
            <Card key={entry.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-300">
                      {entry.memberName.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{entry.memberName}</p>
                    <p className="text-sm text-slate-400">
                      {entry.date instanceof Timestamp
                        ? entry.date.toDate().toLocaleDateString('en-GB')
                        : new Date(entry.date).toLocaleDateString('en-GB')}
                      {entry.note && ` • ${entry.note}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="brand" className="text-lg font-semibold">
                    GHS {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Badge>
                  <button
                    onClick={() => setShowDeleteConfirm(entry)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-slate-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">No entries yet</h3>
          <p className="text-slate-400">Add your first welfare entry for this month</p>
        </Card>
      )}

      {/* Add Welfare Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Welfare Entry"
      >
        <AddWelfareForm
          members={members}
          departments={departments}
          onSubmit={handleAddWelfare}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Entry"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete this welfare entry from{' '}
            <span className="font-semibold text-white">{showDeleteConfirm?.memberName}</span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteWelfare}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Add Welfare Form Component
interface AddWelfareFormProps {
  members: Member[];
  departments: Department[];
  onSubmit: (data: { memberId: string; amount: number; note: string }) => Promise<void>;
  onCancel: () => void;
}

function AddWelfareForm({ members, departments, onSubmit, onCancel }: AddWelfareFormProps) {
  const [filterDepartment, setFilterDepartment] = useState('');
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and map member options based on selected department
  const memberOptions = useMemo(() => {
    let filtered = members;

    // Filter by department if one is selected
    if (filterDepartment) {
      filtered = filtered.filter((m) => m.departmentId === filterDepartment);
    }

    return filtered.map((m) => ({
      value: m.id,
      label: `${m.firstName} ${m.lastName}`,
    }));
  }, [members, filterDepartment]);

  // Reset member selection when department filter changes
  useEffect(() => {
    setMemberId('');
  }, [filterDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId) {
      setError('Please select a member');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ memberId, amount: amountNum, note });
    } catch (err) {
      setError('Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <Select
        label="Filter by Department"
        options={[
          { value: '', label: 'All Departments' },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ]}
        value={filterDepartment}
        onChange={(e) => setFilterDepartment(e.target.value)}
      />

      <SearchableSelect
        label="Member"
        options={memberOptions}
        value={memberId}
        onChange={setMemberId}
        placeholder="Search for a member..."
      />

      <Input
        label="Amount (GHS)"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />

      <Input
        label="Note (Optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Additional notes..."
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Entry
        </Button>
      </div>
    </form>
  );
}
