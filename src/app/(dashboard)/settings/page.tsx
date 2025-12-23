'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, Button, Modal, Input, Select, QRCodeDisplay, useToast, Avatar } from '@/components/ui';
import {
  deleteAdminAccount,
  deleteChurch,
  createRegistrationToken,
  getMembersWithAbsenceCounts,
  getAttendanceRecords,
  getYTDTithes,
  getChurch,
} from '@/lib/firebase/firestore';
import {
  exportMembersToPDF,
  exportMembersToCSV,
  exportAttendanceToPDF,
  exportAttendanceToCSV,
  exportFinanceToPDF,
  exportFinanceToCSV,
  ExportFormat,
} from '@/lib/utils/export';

export default function SettingsPage() {
  const { user, adminData, signOut } = useAuth();
  const { error: showError, success } = useToast();
  const [showDeleteAdmin, setShowDeleteAdmin] = useState(false);
  const [showDeleteChurch, setShowDeleteChurch] = useState(false);
  const [churchNameConfirm, setChurchNameConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Token generation state
  const [expirationMinutes, setExpirationMinutes] = useState(10);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportType, setExportType] = useState<'members' | 'attendance' | 'finance'>('members');

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

  // Token generation handler
  const handleGenerateToken = async () => {
    if (!adminData?.churchId || !user?.uid) return;

    setGeneratingToken(true);
    try {
      const tokenId = await createRegistrationToken(
        adminData.churchId,
        user.uid,
        expirationMinutes
      );

      // Create the full token (churchId_tokenId format)
      const fullToken = `${adminData.churchId}_${tokenId}`;
      setGeneratedToken(fullToken);
      success('Registration link generated successfully');
    } catch (error) {
      console.error('Error generating token:', error);
      showError('Failed to generate registration link');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedToken) {
      const url = `${window.location.origin}/join?t=${generatedToken}`;
      navigator.clipboard.writeText(url);
      success('Link copied to clipboard');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('.qr-code-container svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = 'registration-qr-code.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      success('QR code downloaded');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Export handler
  const handleExport = async () => {
    if (!adminData?.churchId) return;

    setExporting(true);
    try {
      const church = await getChurch(adminData.churchId);
      const options = { churchName: church?.name || 'Church', exportDate: new Date() };

      switch (exportType) {
        case 'members': {
          const members = await getMembersWithAbsenceCounts(adminData.churchId);
          exportFormat === 'pdf'
            ? exportMembersToPDF({ members, options })
            : exportMembersToCSV({ members, options });
          break;
        }
        case 'attendance': {
          const records = await getAttendanceRecords(adminData.churchId, 100);
          exportFormat === 'pdf'
            ? exportAttendanceToPDF({ records, options })
            : exportAttendanceToCSV({ records, options });
          break;
        }
        case 'finance': {
          const tithes = await getYTDTithes(adminData.churchId);
          const totalAmount = tithes.reduce((sum, t) => sum + t.amount, 0);
          exportFormat === 'pdf'
            ? exportFinanceToPDF({ tithes, totalAmount, options })
            : exportFinanceToCSV({ tithes, totalAmount, options });
          break;
        }
      }

      success(`Exported ${exportType} as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      showError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // For now, use a placeholder church name since we don't have it in adminData
  const churchName = 'DELETE';

  // Get the registration URL
  const registrationUrl = generatedToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?t=${generatedToken}`
    : '';

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
            <Avatar
              name={adminData?.name}
              src={adminData?.photoUrl}
              size="xl"
            />
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
          <CardTitle>About Ekklesia</CardTitle>
        </CardHeader>
        <div className="space-y-4 text-slate-300">
          <p>
            Ekklesia is a modern church management system designed to streamline church administration.
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
        <div className="flex items-end gap-3">
          <Select
            label="Format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'csv', label: 'CSV' },
            ]}
            className="w-24"
            disabled
          />
          <Select
            label="Data"
            value={exportType}
            onChange={(e) => setExportType(e.target.value as 'members' | 'attendance' | 'finance')}
            options={[
              { value: 'members', label: 'Members' },
              { value: 'attendance', label: 'Attendance' },
              { value: 'finance', label: 'Finance (YTD)' },
            ]}
            className="w-44"
            disabled
          />
          <Button
            variant="primary"
            size="lg"
            className="ml-auto"
            onClick={handleExport}
            loading={exporting}
            loadingText="Exporting..."
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          This feature is available with a premium subscription. Contact us to enable.
        </p>
      </Card>

      {/* Member Self-Registration */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Member Self-Registration</CardTitle>
        </CardHeader>
        <p className="text-slate-300 mb-4">
          Generate a temporary registration link that new members can use to register themselves.
          The link will expire after the specified time. Submissions require your approval before
          members are added to the system.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Link expires in
            </label>
            <Select
              value={String(expirationMinutes)}
              onChange={(e) => setExpirationMinutes(Number(e.target.value))}
              options={[
                { value: '5', label: '5 minutes' },
                { value: '10', label: '10 minutes' },
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
              ]}
              disabled
            />
          </div>
          <Button onClick={handleGenerateToken} loading={generatingToken} loadingText="Generating..." disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Generate Link
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          This feature is available with a premium subscription. Contact us to enable.
        </p>

        {/* Generated Link Display */}
        {generatedToken && (
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white">Registration Link</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </Button>
                <Button size="sm" variant="secondary" onClick={handleDownloadQR}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR
                </Button>
              </div>
            </div>

            <code className="block text-sm text-brand-300 break-all mb-4 p-2 bg-black/20 rounded">
              {registrationUrl}
            </code>

            {/* QR Code */}
            <div className="qr-code-container flex justify-center p-4 bg-white rounded-lg">
              <QRCodeDisplay value={registrationUrl} size={200} />
            </div>

            <p className="text-xs text-slate-500 text-center mt-3">
              Scan this QR code or share the link to open the registration form.
              <br />
              Expires in {expirationMinutes} minutes from generation.
            </p>
          </div>
        )}
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
