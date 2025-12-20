import { Timestamp } from 'firebase/firestore';

// Church types
export interface Church {
  id: string;
  name: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Department types
export interface Department {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Timestamp;
}

// Member types
export type Gender = 'male' | 'female';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: Gender;
  dob?: Timestamp | null;
  joinedDate?: Timestamp | null;
  joinedVia?: string;
  departmentId: string;
  departmentName: string;
  residence?: string;
  photoUrl?: string;
  notes?: string;
  flagged: boolean;
  absenceCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Attendance types
export interface AttendanceRecord {
  id: string; // Format: YYYY-MM-DD
  date: Timestamp;
  dateString: string;
  presentCount: number;
  absentCount: number;
  records: Record<string, { present: boolean; note?: string }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tithe/Finance types
export interface TitheRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  month: string; // YYYY-MM format
  date: Timestamp;
  note?: string;
  createdAt: Timestamp;
}

// Admin types
export type AdminRole = 'super_admin' | 'admin' | 'viewer';

export interface Admin {
  uid: string;
  email: string;
  name: string;
  churchId: string;
  role: AdminRole;
  createdAt: Timestamp;
}

// Dashboard stats
export interface DashboardStats {
  totalMembers: number;
  totalDepartments: number;
  presentToday: number;
  absentToday: number;
  monthlyTithes: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  membersByDepartment: Record<string, number>;
  membershipGrowth: Record<string, number>;
}

// Form types
export interface MemberFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: Gender;
  dob?: string;
  joinedDate?: string;
  joinedVia?: string;
  departmentId: string;
  residence?: string;
  notes?: string;
  photo?: File;
}

export interface AttendanceFormData {
  date: string;
  records: Record<string, { present: boolean; note?: string }>;
}

export interface TitheFormData {
  memberId: string;
  amount: number;
  month: string;
  date: string;
  note?: string;
}

// Offline sync types
export interface PendingSyncItem {
  id: string;
  type: 'attendance' | 'member' | 'tithe';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

// Registration Token for self-registration
export interface RegistrationToken {
  id: string;
  churchId: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  usageCount: number;
}

// Pending Member (awaiting approval)
export interface PendingMember {
  id: string;
  tokenId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: Gender;
  dob?: Timestamp | null;
  departmentId: string;
  departmentName: string;
  residence?: string;
  notes?: string;
  photoUrl?: string;
  submittedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}

// Form data for public registration
export interface PublicRegistrationFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: Gender;
  dob?: string;
  departmentId: string;
  residence?: string;
  notes?: string;
  photo?: File;
}

// Predefined departments
export const DEPARTMENTS = [
  'Worship & Music',
  'Ushering',
  'Media & Tech',
  'Children Ministry',
  'Youth Ministry',
  'Women Fellowship',
  'Men Fellowship',
  'Prayer Team',
  'Evangelism',
  'Hospitality',
  'Sanctuary Keepers',
  'Counseling',
  'Community Outreach',
  'Administration',
] as const;
