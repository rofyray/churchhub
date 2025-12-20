'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMembers, getTithes, createTithe, deleteTithe } from '@/lib/firebase/firestore';
import { Button, Input, Select, Card, Modal, Badge, useToast } from '@/components/ui';
import { Member, TitheRecord } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export default function FinancePage() {
  const { adminData } = useAuth();
  const { success, error: showError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [tithes, setTithes] = useState<TitheRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TitheRecord | null>(null);

  const churchId = adminData?.churchId || '';

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      });
    }
    return options;
  }, []);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!churchId) return;

      setLoading(true);
      try {
        const [membersList, tithesList] = await Promise.all([
          getMembers(churchId),
          getTithes(churchId, selectedMonth),
        ]);
        setMembers(membersList);
        setTithes(tithesList);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [churchId, selectedMonth]);

  // Stats
  const stats = useMemo(() => {
    const total = tithes.reduce((sum, t) => sum + t.amount, 0);
    const count = tithes.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [tithes]);

  const handleAddTithe = async (data: {
    memberId: string;
    amount: number;
    note: string;
  }) => {
    if (!churchId) return;

    const member = members.find((m) => m.id === data.memberId);
    if (!member) return;

    try {
      await createTithe(churchId, {
        memberId: data.memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        amount: data.amount,
        month: selectedMonth,
        date: Timestamp.fromDate(new Date()),
        note: data.note,
      });

      // Refresh tithes
      const updatedTithes = await getTithes(churchId, selectedMonth);
      setTithes(updatedTithes);
      setShowAddModal(false);
      success('Tithe entry added successfully');
    } catch (err) {
      console.error('Error adding tithe:', err);
      showError('Failed to add tithe entry');
    }
  };

  const handleDeleteTithe = async () => {
    if (!churchId || !showDeleteConfirm) return;

    try {
      await deleteTithe(churchId, showDeleteConfirm.id);

      // Refresh tithes
      const updatedTithes = await getTithes(churchId, selectedMonth);
      setTithes(updatedTithes);
      setShowDeleteConfirm(null);
      success('Tithe entry deleted');
    } catch (err) {
      console.error('Error deleting tithe:', err);
      showError('Failed to delete tithe entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-slate-400 mt-1">Track tithes and offerings</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={monthOptions}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-brand-600/10 border-brand-500/20">
          <p className="text-sm text-slate-400">Total This Month</p>
          <p className="text-3xl font-bold text-white mt-1">
            ₵{stats.total.toLocaleString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400">Number of Entries</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400">Average Amount</p>
          <p className="text-3xl font-bold text-white mt-1">
            ₵{stats.average.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Tithe List */}
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
      ) : tithes.length > 0 ? (
        <div className="space-y-2">
          {tithes.map((tithe) => (
            <Card key={tithe.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-300">
                      {tithe.memberName.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{tithe.memberName}</p>
                    <p className="text-sm text-slate-400">
                      {tithe.date instanceof Timestamp
                        ? tithe.date.toDate().toLocaleDateString('en-GB')
                        : new Date(tithe.date).toLocaleDateString('en-GB')}
                      {tithe.note && ` • ${tithe.note}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="brand" className="text-lg font-semibold">
                    ₵{tithe.amount.toLocaleString()}
                  </Badge>
                  <button
                    onClick={() => setShowDeleteConfirm(tithe)}
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
          <p className="text-slate-400">Add your first tithe entry for this month</p>
        </Card>
      )}

      {/* Add Tithe Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Tithe Entry"
      >
        <AddTitheForm
          members={members}
          onSubmit={handleAddTithe}
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
            Are you sure you want to delete this tithe entry from{' '}
            <span className="font-semibold text-white">{showDeleteConfirm?.memberName}</span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTithe}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Add Tithe Form Component
interface AddTitheFormProps {
  members: Member[];
  onSubmit: (data: { memberId: string; amount: number; note: string }) => Promise<void>;
  onCancel: () => void;
}

function AddTitheForm({ members, onSubmit, onCancel }: AddTitheFormProps) {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.firstName} ${m.lastName}`,
  }));

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
        label="Member"
        options={memberOptions}
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="Select a member"
      />

      <Input
        label="Amount (₵)"
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
