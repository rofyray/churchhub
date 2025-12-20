'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMembers } from '@/lib/hooks/useMembers';
import {
  getDepartments,
  getPendingMembers,
  approvePendingMember,
  rejectPendingMember,
} from '@/lib/firebase/firestore';
import { uploadMemberPhoto } from '@/lib/firebase/storage';
import { Button, Modal, Card, useToast, Avatar } from '@/components/ui';
import MemberList from '@/components/members/MemberList';
import MemberForm from '@/components/members/MemberForm';
import PendingMemberList from '@/components/members/PendingMemberList';
import { Member, Department, MemberFormData, PendingMember } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { formatPhoneNumber } from '@/lib/utils/format';

export default function MembersPage() {
  const { adminData, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, loading, error, addMember, editMember, removeMember, refetch } = useMembers();
  const { success, error: showError } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pending members state
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Check for action=add in URL
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
      router.replace('/members'); // Clear the query param
    }
  }, [searchParams, router]);

  // Load departments
  useEffect(() => {
    async function loadDepartments() {
      if (!adminData?.churchId) return;
      try {
        const depts = await getDepartments(adminData.churchId);
        setDepartments(depts);
      } catch (err) {
        console.error('Error loading departments:', err);
        showError('Failed to load departments');
      }
    }
    loadDepartments();
  }, [adminData?.churchId]);

  // Load pending members when tab changes to pending
  useEffect(() => {
    async function loadPending() {
      if (!adminData?.churchId || activeTab !== 'pending') return;
      setPendingLoading(true);
      try {
        const pending = await getPendingMembers(adminData.churchId);
        setPendingMembers(pending);
      } catch (err) {
        console.error('Error loading pending members:', err);
        showError('Failed to load pending members');
      } finally {
        setPendingLoading(false);
      }
    }
    loadPending();
  }, [adminData?.churchId, activeTab]);

  // Load pending count for badge on initial load
  useEffect(() => {
    async function loadPendingCount() {
      if (!adminData?.churchId) return;
      try {
        const pending = await getPendingMembers(adminData.churchId);
        setPendingMembers(pending);
      } catch (err) {
        console.error('Error loading pending count:', err);
        showError('Failed to load pending members');
      }
    }
    loadPendingCount();
  }, [adminData?.churchId]);

  // Pending member handlers
  const handleApprovePending = async (member: PendingMember) => {
    if (!adminData?.churchId || !user?.uid) return;

    try {
      await approvePendingMember(adminData.churchId, member.id, user.uid);
      setPendingMembers((prev) => prev.filter((p) => p.id !== member.id));
      refetch();
      success(`${member.firstName} ${member.lastName} approved!`);
    } catch (err) {
      console.error('Approval error:', err);
      showError('Failed to approve member');
    }
  };

  const handleRejectPending = async (member: PendingMember, reason?: string) => {
    if (!adminData?.churchId || !user?.uid) return;

    try {
      await rejectPendingMember(adminData.churchId, member.id, user.uid, reason);
      setPendingMembers((prev) => prev.filter((p) => p.id !== member.id));
      success('Registration rejected');
    } catch (err) {
      console.error('Rejection error:', err);
      showError('Failed to reject registration');
    }
  };

  const handleAddMember = async (formData: MemberFormData) => {
    if (!adminData?.churchId) return;

    setActionLoading(true);
    try {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (formData.photo) {
        // Create a temporary ID for the photo path
        const tempId = Date.now().toString();
        photoUrl = await uploadMemberPhoto(adminData.churchId, tempId, formData.photo);
      }

      // Find department name
      const dept = departments.find((d) => d.id === formData.departmentId);
      const departmentName = dept?.name || '';

      await addMember(formData, departmentName, photoUrl);

      setShowAddModal(false);
      success('Member added successfully');
    } catch (err) {
      console.error('Error adding member:', err);
      showError('Failed to add member');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMember = async (formData: MemberFormData) => {
    if (!adminData?.churchId || !selectedMember) return;

    setActionLoading(true);
    try {
      let photoUrl: string | undefined;

      // Upload new photo if provided
      if (formData.photo) {
        photoUrl = await uploadMemberPhoto(adminData.churchId, selectedMember.id, formData.photo);
      }

      // Find department name
      const dept = departments.find((d) => d.id === formData.departmentId);
      const departmentName = dept?.name || '';

      await editMember(selectedMember.id, formData, departmentName, photoUrl);

      setSelectedMember(null);
      setIsEditing(false);
      success('Member updated successfully');
    } catch (err) {
      console.error('Error editing member:', err);
      showError('Failed to update member');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    setActionLoading(true);
    try {
      await removeMember(selectedMember.id);
      setShowDeleteConfirm(false);
      setSelectedMember(null);
      success('Member deleted successfully');
    } catch (err) {
      console.error('Error deleting member:', err);
      showError('Failed to delete member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-slate-400 mt-1">
            Manage your church members
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pending
          {pendingMembers.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
              {pendingMembers.length}
            </span>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <p className="text-red-300">{error}</p>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'members' ? (
        <MemberList
          members={members}
          departments={departments}
          loading={loading}
          onMemberClick={handleMemberClick}
        />
      ) : (
        <PendingMemberList
          members={pendingMembers}
          loading={pendingLoading}
          onApprove={handleApprovePending}
          onReject={handleRejectPending}
        />
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Member"
        size="lg"
      >
        <MemberForm
          departments={departments}
          onSubmit={handleAddMember}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* View/Edit Member Modal */}
      <Modal
        isOpen={!!selectedMember && !showDeleteConfirm}
        onClose={() => {
          setSelectedMember(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Edit Member' : selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
        size="lg"
      >
        {selectedMember && (
          isEditing ? (
            <MemberForm
              departments={departments}
              initialData={{
                firstName: selectedMember.firstName,
                lastName: selectedMember.lastName,
                email: selectedMember.email || '',
                phone: selectedMember.phone,
                gender: selectedMember.gender,
                dob: selectedMember.dob ? selectedMember.dob.toDate().toISOString().slice(0, 10) : '',
                joinedDate: selectedMember.joinedDate ? selectedMember.joinedDate.toDate().toISOString().slice(0, 10) : '',
                joinedVia: selectedMember.joinedVia || '',
                departmentId: selectedMember.departmentId,
                residence: selectedMember.residence || '',
                notes: selectedMember.notes || '',
              }}
              onSubmit={handleEditMember}
              onCancel={() => setIsEditing(false)}
              isEdit
            />
          ) : (
            <div className="space-y-6">
              {/* Member details */}
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={selectedMember.photoUrl}
                    name={`${selectedMember.firstName} ${selectedMember.lastName}`}
                    size="xl"
                    showBadge={(selectedMember.absenceCount ?? 0) >= 1}
                    badgeColor={selectedMember.flagged ? "danger" : "warning"}
                    className="w-24 h-24"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Department</p>
                      <p className="text-white">{selectedMember.departmentName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Gender</p>
                      <p className="text-white capitalize">{selectedMember.gender || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      {selectedMember.phone ? (
                        <a
                          href={`tel:+233${selectedMember.phone}`}
                          className="text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          {formatPhoneNumber(selectedMember.phone)}
                        </a>
                      ) : (
                        <p className="text-white">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      {selectedMember.email ? (
                        <a
                          href={`mailto:${selectedMember.email}`}
                          className="text-brand-400 hover:text-brand-300 transition-colors truncate block"
                        >
                          {selectedMember.email}
                        </a>
                      ) : (
                        <p className="text-white">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-sm text-slate-400">Residence</p>
                  <p className="text-white">{selectedMember.residence || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Joined Via</p>
                  <p className="text-white">{selectedMember.joinedVia || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Date of Birth</p>
                  <p className="text-white">
                    {selectedMember.dob
                      ? new Date(selectedMember.dob.toDate()).toLocaleDateString('en-GB')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Joined Date</p>
                  <p className="text-white">
                    {selectedMember.joinedDate
                      ? new Date(selectedMember.joinedDate.toDate()).toLocaleDateString('en-GB')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedMember.notes && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-400 mb-1">Notes</p>
                  <p className="text-white">{selectedMember.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedMember(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">
              {selectedMember?.firstName} {selectedMember?.lastName}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleDeleteMember}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
