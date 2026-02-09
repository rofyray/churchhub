import { Member, AttendanceRecord, WelfareRecord } from '@/lib/types';

export type ExportFormat = 'pdf' | 'csv';

export interface ExportOptions {
  churchName: string;
  exportDate: Date;
}

export interface MemberExportData {
  members: Member[];
  options: ExportOptions;
}

export interface AttendanceExportData {
  records: AttendanceRecord[];
  options: ExportOptions;
}

export interface FinanceExportData {
  welfare: WelfareRecord[];
  totalAmount: number;
  options: ExportOptions;
}
