'use client';

import { useState } from 'react';
import { Card, Button, Modal, Input, Spinner } from '@/components/ui';
import { PendingMember } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils/format';

interface PendingMemberListProps {
  members: PendingMember[];
  loading: boolean;
  onApprove: (member: PendingMember) => Promise<void>;
  onReject: (member: PendingMember, reason?: string) => Promise<void>;
}

export default function PendingMemberList({
  members,
  loading,
  onApprove,
  onReject,
}: PendingMemberListProps) {
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Pending Registrations</h3>
        <p className="text-slate-400">All member registrations have been reviewed.</p>
      </div>
    );
  }

  const handleApprove = async (member: PendingMember) => {
    setActionLoading(member.id);
    try {
      await onApprove(member);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedMember) return;
    setActionLoading(selectedMember.id);
    try {
      await onReject(selectedMember, rejectionReason);
      setShowRejectModal(false);
      setSelectedMember(null);
      setRejectionReason('');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Avatar */}
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-amber-400">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0">
                <button
                  onClick={() => {
                    setSelectedMember(member);
                    setShowDetailModal(true);
                  }}
                  className="text-left"
                >
                  <p className="font-medium text-white hover:text-brand-300 transition-colors">
                    {member.firstName} {member.lastName}
                  </p>
                </button>
                <p className="text-sm text-slate-400 truncate">
                  {member.departmentName} &middot; {formatPhoneNumber(member.phone)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted {formatDate(member.submittedAt)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedMember(member);
                  setShowRejectModal(true);
                }}
                disabled={actionLoading === member.id}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(member)}
                loading={actionLoading === member.id}
                loadingText="..."
              >
                Approve
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedMember(null);
          setRejectionReason('');
        }}
        title="Reject Registration"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to reject the registration for{' '}
            <span className="font-medium text-white">
              {selectedMember?.firstName} {selectedMember?.lastName}
            </span>
            ?
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Reason (optional)
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter a reason for rejection..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedMember(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={actionLoading === selectedMember?.id}
              loadingText="Rejecting..."
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMember(null);
        }}
        title="Registration Details"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-4">
            {/* Photo and name */}
            <div className="flex items-center gap-4">
              {selectedMember.photoUrl ? (
                <img
                  src={selectedMember.photoUrl}
                  alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-amber-400">
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-white">
                  {selectedMember.firstName} {selectedMember.lastName}
                </h3>
                <p className="text-slate-400">{selectedMember.departmentName}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/10">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                <p className="text-white mt-1">{formatPhoneNumber(selectedMember.phone)}</p>
              </div>
              {selectedMember.email && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                  <p className="text-white mt-1">{selectedMember.email}</p>
                </div>
              )}
              {selectedMember.gender && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Gender</p>
                  <p className="text-white mt-1 capitalize">{selectedMember.gender}</p>
                </div>
              )}
              {selectedMember.dob && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-white mt-1">
                    {selectedMember.dob.toDate().toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedMember.residence && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Residence</p>
                  <p className="text-white mt-1">{selectedMember.residence}</p>
                </div>
              )}
              {selectedMember.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Notes</p>
                  <p className="text-white mt-1">{selectedMember.notes}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted</p>
                <p className="text-white mt-1">{formatDate(selectedMember.submittedAt)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailModal(false);
                  setShowRejectModal(true);
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  handleApprove(selectedMember);
                  setShowDetailModal(false);
                }}
                loading={actionLoading === selectedMember.id}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

PendingMemberList.displayName = 'PendingMemberList';
