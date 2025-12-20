import { jsPDF } from 'jspdf';
import { MemberExportData, AttendanceExportData, FinanceExportData } from './types';
import { Timestamp } from 'firebase/firestore';

// Constants for PDF layout
const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm

// Helper to format date from Timestamp
function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp || !('toDate' in timestamp)) return '-';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-GB');
}

// Generate filename with church name and date
function generateFilename(churchName: string, type: string): string {
  const sanitizedChurchName = churchName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  return `${sanitizedChurchName}_${type}_${dateStr}.pdf`;
}

// Add header to PDF (portrait)
function addHeader(doc: jsPDF, churchName: string, title: string, exportDate: Date): number {
  let y = MARGIN;

  // Church name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(churchName, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  // Export date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${exportDate.toLocaleDateString('en-GB')} at ${exportDate.toLocaleTimeString('en-GB')}`,
    PAGE_WIDTH / 2,
    y,
    { align: 'center' }
  );
  doc.setTextColor(0);
  y += 10;

  // Divider line
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  return y;
}

// Add footer with page numbers
function addFooter(doc: jsPDF, pageWidth: number = PAGE_WIDTH, pageHeight: number = PAGE_HEIGHT): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

// Draw table with headers and data (portrait)
function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
  contentWidth: number = PAGE_WIDTH - MARGIN * 2,
  pageHeight: number = PAGE_HEIGHT
): number {
  const rowHeight = 8;
  const headerHeight = 10;
  let y = startY;

  // Table header
  doc.setFillColor(59, 130, 246); // Brand blue
  doc.rect(MARGIN, y, contentWidth, headerHeight, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);

  let x = MARGIN + 2;
  headers.forEach((header, i) => {
    doc.text(header, x, y + 7);
    x += columnWidths[i];
  });
  y += headerHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(8);

  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > pageHeight - 30) {
      doc.addPage();
      y = MARGIN;

      // Redraw header on new page
      doc.setFillColor(59, 130, 246);
      doc.rect(MARGIN, y, contentWidth, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      x = MARGIN + 2;
      headers.forEach((header, i) => {
        doc.text(header, x, y + 7);
        x += columnWidths[i];
      });
      y += headerHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(MARGIN, y, contentWidth, rowHeight, 'F');
    }

    x = MARGIN + 2;
    row.forEach((cell, i) => {
      // Truncate text if too long
      const maxChars = Math.floor(columnWidths[i] / 2);
      const displayText = cell.length > maxChars ? cell.substring(0, maxChars - 2) + '..' : cell;
      doc.text(displayText, x, y + 5);
      x += columnWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

export function exportMembersToPDF({ members, options }: MemberExportData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const landscapeWidth = PAGE_HEIGHT; // 297mm in landscape
  const landscapeHeight = PAGE_WIDTH; // 210mm in landscape
  const contentWidth = landscapeWidth - MARGIN * 2;

  let y = MARGIN;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.churchName, landscapeWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Members Report', landscapeWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Total Members: ${members.length} | Generated: ${options.exportDate.toLocaleDateString('en-GB')}`,
    landscapeWidth / 2,
    y,
    { align: 'center' }
  );
  doc.setTextColor(0);
  y += 15;

  // Table
  const headers = ['Name', 'Phone', 'Gender', 'DOB', 'Joined', 'Department', 'Residence', 'Absences'];
  const columnWidths = [45, 35, 20, 25, 25, 40, 45, 22];
  const rowHeight = 8;
  const headerHeight = 10;

  const rows = members.map(m => [
    `${m.firstName} ${m.lastName}`,
    m.phone || '-',
    m.gender || '-',
    formatDate(m.dob),
    formatDate(m.joinedDate),
    m.departmentName || '-',
    m.residence || '-',
    String(m.absenceCount ?? 0),
  ]);

  // Header row
  doc.setFillColor(59, 130, 246);
  doc.rect(MARGIN, y, contentWidth, headerHeight, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);

  let x = MARGIN + 2;
  headers.forEach((header, i) => {
    doc.text(header, x, y + 7);
    x += columnWidths[i];
  });
  y += headerHeight;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(8);

  rows.forEach((row, rowIndex) => {
    if (y > landscapeHeight - 20) {
      doc.addPage('landscape');
      y = MARGIN;

      // Redraw header
      doc.setFillColor(59, 130, 246);
      doc.rect(MARGIN, y, contentWidth, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      x = MARGIN + 2;
      headers.forEach((header, i) => {
        doc.text(header, x, y + 7);
        x += columnWidths[i];
      });
      y += headerHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(MARGIN, y, contentWidth, rowHeight, 'F');
    }

    x = MARGIN + 2;
    row.forEach((cell, i) => {
      const maxChars = Math.floor(columnWidths[i] / 2);
      const displayText = cell.length > maxChars ? cell.substring(0, maxChars - 2) + '..' : cell;
      doc.text(displayText, x, y + 5);
      x += columnWidths[i];
    });
    y += rowHeight;
  });

  addFooter(doc, landscapeWidth, landscapeHeight);
  doc.save(generateFilename(options.churchName, 'Members'));
}

export function exportAttendanceToPDF({ records, options }: AttendanceExportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addHeader(doc, options.churchName, 'Attendance Report', options.exportDate);

  // Summary stats
  const totalPresent = records.reduce((sum, r) => sum + r.presentCount, 0);
  const totalAbsent = records.reduce((sum, r) => sum + r.absentCount, 0);
  const total = totalPresent + totalAbsent;
  const avgRate = total > 0 ? ((totalPresent / total) * 100).toFixed(1) : '0';

  doc.setFontSize(10);
  doc.text(`Records: ${records.length} | Average Attendance: ${avgRate}%`, MARGIN, y);
  y += 10;

  // Table
  const headers = ['Date', 'Present', 'Absent', 'Total', 'Attendance Rate'];
  const columnWidths = [40, 30, 30, 30, 40];

  const rows = records.map(r => {
    const recordTotal = r.presentCount + r.absentCount;
    const rate = recordTotal > 0 ? ((r.presentCount / recordTotal) * 100).toFixed(1) + '%' : 'N/A';
    return [r.dateString, String(r.presentCount), String(r.absentCount), String(recordTotal), rate];
  });

  drawTable(doc, y, headers, rows, columnWidths);
  addFooter(doc);
  doc.save(generateFilename(options.churchName, 'Attendance'));
}

export function exportFinanceToPDF({ tithes, totalAmount, options }: FinanceExportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addHeader(doc, options.churchName, 'Finance Report (YTD Tithes)', options.exportDate);

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total YTD: GHS ${totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 6;
  doc.text(`Total Records: ${tithes.length}`, MARGIN, y);
  y += 10;

  // Table
  const headers = ['Member Name', 'Amount (GHS)', 'Month', 'Date', 'Note'];
  const columnWidths = [50, 30, 25, 30, 35];

  const rows = tithes.map(t => [
    t.memberName,
    t.amount.toFixed(2),
    t.month,
    formatDate(t.date),
    t.note || '-',
  ]);

  drawTable(doc, y, headers, rows, columnWidths);
  addFooter(doc);
  doc.save(generateFilename(options.churchName, 'Finance'));
}
