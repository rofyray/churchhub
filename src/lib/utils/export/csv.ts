import { MemberExportData, AttendanceExportData, FinanceExportData } from './types';
import { Timestamp } from 'firebase/firestore';

// Helper to escape CSV values
function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Helper to format date from Timestamp
function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp || !('toDate' in timestamp)) return '';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-GB');
}

// Generate filename with church name and date
function generateFilename(churchName: string, type: string, extension: string): string {
  const sanitizedChurchName = churchName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  return `${sanitizedChurchName}_${type}_${dateStr}.${extension}`;
}

// Download CSV file
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMembersToCSV({ members, options }: MemberExportData): void {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Gender',
    'Date of Birth',
    'Joined Date',
    'Department',
    'Residence',
    'Absence Count',
    'Flagged'
  ];

  const rows = members.map(m => [
    escapeCSV(m.firstName),
    escapeCSV(m.lastName),
    escapeCSV(m.email),
    escapeCSV(m.phone),
    escapeCSV(m.gender),
    escapeCSV(formatDate(m.dob)),
    escapeCSV(formatDate(m.joinedDate)),
    escapeCSV(m.departmentName),
    escapeCSV(m.residence),
    escapeCSV(m.absenceCount ?? 0),
    escapeCSV(m.flagged ? 'Yes' : 'No'),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = generateFilename(options.churchName, 'Members', 'csv');
  downloadCSV(csv, filename);
}

export function exportAttendanceToCSV({ records, options }: AttendanceExportData): void {
  const headers = ['Date', 'Present Count', 'Absent Count', 'Total', 'Attendance Rate'];

  const rows = records.map(r => {
    const total = r.presentCount + r.absentCount;
    const rate = total > 0 ? ((r.presentCount / total) * 100).toFixed(1) + '%' : 'N/A';
    return [
      escapeCSV(r.dateString),
      escapeCSV(r.presentCount),
      escapeCSV(r.absentCount),
      escapeCSV(total),
      escapeCSV(rate),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = generateFilename(options.churchName, 'Attendance', 'csv');
  downloadCSV(csv, filename);
}

export function exportFinanceToCSV({ welfare, options }: FinanceExportData): void {
  const headers = ['Member Name', 'Amount (GHS)', 'Month', 'Date', 'Note'];

  const rows = welfare.map(t => [
    escapeCSV(t.memberName),
    escapeCSV(t.amount.toFixed(2)),
    escapeCSV(t.month),
    escapeCSV(formatDate(t.date)),
    escapeCSV(t.note),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = generateFilename(options.churchName, 'Finance', 'csv');
  downloadCSV(csv, filename);
}
