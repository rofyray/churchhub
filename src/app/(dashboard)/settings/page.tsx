'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, Button, Modal, Input, useToast } from '@/components/ui';
import { deleteAdminAccount, deleteChurch } from '@/lib/firebase/firestore';

export default function SettingsPage() {
  const { user, adminData, signOut } = useAuth();
  const { error: showError } = useToast();
  const [showDeleteAdmin, setShowDeleteAdmin] = useState(false);
  const [showDeleteChurch, setShowDeleteChurch] = useState(false);
  const [churchNameConfirm, setChurchNameConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAdmin = async () => {
    if (!user?.uid) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminAccount(user.uid);
      await signOut();
    } catch (error) {
      console.error('Error deleting admin account:', error);
      const errorMsg = 'Failed to delete admin account. Please try again.';
      setDeleteError(errorMsg);
      showError(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteChurch = async () => {
    if (!adminData?.churchId) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteChurch(adminData.churchId);
      await signOut();
    } catch (error) {
      console.error('Error deleting church:', error);
      const errorMsg = 'Failed to delete church. Please try again.';
      setDeleteError(errorMsg);
      showError(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  // For now, use a placeholder church name since we don't have it in adminData
  const churchName = 'DELETE';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Info */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-brand-600/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-brand-300">
                {adminData?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium text-white">{adminData?.name || 'Admin'}</p>
              <p className="text-slate-400">{adminData?.email}</p>
              <p className="text-sm text-slate-500 mt-1">
                Role: <span className="capitalize">{adminData?.role?.replace('_', ' ') || 'Admin'}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>About Church Hub</CardTitle>
        </CardHeader>
        <div className="space-y-4 text-slate-300">
          <p>
            Church Hub is a modern church management system designed to streamline church administration.
            It helps you manage members, track attendance, and record financial contributions.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-sm text-slate-400">Version</p>
              <p className="font-medium text-white">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Platform</p>
              <p className="font-medium text-white">Web Application</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Export */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <p className="text-slate-300 mb-4">
          Export your church data for backup or reporting purposes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Members (PDF)
          </Button>
          <Button variant="secondary" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Attendance (PDF)
          </Button>
          <Button variant="secondary" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Finance (PDF)
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-3">
          Coming soon: PDF export functionality
        </p>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <div className="space-y-6">
          {/* Delete Admin Account */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <p className="font-medium text-white">Delete Admin Account</p>
              <p className="text-sm text-slate-400 mt-1">
                Remove your admin access. You will be signed out and will need to be re-added by another admin.
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteAdmin(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Delete Account
            </Button>
          </div>

          {/* Delete Church */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-white">Delete Church</p>
              <p className="text-sm text-slate-400 mt-1">
                Permanently delete this church and all its data including members, attendance records, and tithes. This action cannot be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteChurch(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Church
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Admin Confirmation Modal */}
      <Modal
        isOpen={showDeleteAdmin}
        onClose={() => {
          setShowDeleteAdmin(false);
          setDeleteError(null);
        }}
        title="Delete Admin Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete your admin account? You will be signed out and will need to be re-added by another admin to regain access.
          </p>
          {deleteError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{deleteError}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => {
              setShowDeleteAdmin(false);
              setDeleteError(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAdmin}
              loading={deleting}
              loadingText="Deleting..."
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Church Confirmation Modal */}
      <Modal
        isOpen={showDeleteChurch}
        onClose={() => {
          setShowDeleteChurch(false);
          setChurchNameConfirm('');
          setDeleteError(null);
        }}
        title="Delete Church"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-medium">Warning: This action is irreversible!</p>
            <p className="text-sm text-slate-400 mt-1">
              This will permanently delete all church data including members, departments, attendance records, and tithe entries.
            </p>
          </div>
          <div>
            <p className="text-slate-300 mb-2">
              Type <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-red-400">{churchName}</span> to confirm:
            </p>
            <Input
              value={churchNameConfirm}
              onChange={(e) => setChurchNameConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          {deleteError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{deleteError}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteChurch(false);
                setChurchNameConfirm('');
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteChurch}
              disabled={churchNameConfirm !== churchName}
              loading={deleting}
              loadingText="Deleting..."
            >
              Delete Church Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
