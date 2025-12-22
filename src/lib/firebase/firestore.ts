import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
  Member,
  Department,
  AttendanceRecord,
  TitheRecord,
  DEPARTMENTS,
  RegistrationToken,
  PendingMember,
  Church,
} from '@/lib/types';

// Helper to get church collection path
const getChurchPath = (churchId: string) => `churches/${churchId}`;

// ==================== CHURCH ====================

export async function getChurch(churchId: string): Promise<Church | null> {
  const docRef = doc(db, 'churches', churchId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Church;
  }
  return null;
}

// ==================== DEPARTMENTS ====================

export async function getDepartments(churchId: string): Promise<Department[]> {
  const deptRef = collection(db, getChurchPath(churchId), 'departments');
  const snapshot = await getDocs(query(deptRef, orderBy('name')));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Department));
}

export async function initializeDepartments(churchId: string): Promise<void> {
  const deptRef = collection(db, getChurchPath(churchId), 'departments');
  const snapshot = await getDocs(deptRef);

  if (snapshot.empty) {
    const batch = writeBatch(db);
    DEPARTMENTS.forEach((name) => {
      const docRef = doc(deptRef);
      batch.set(docRef, {
        name,
        description: '',
        memberCount: 0,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

// ==================== MEMBERS ====================

export async function getMembers(churchId: string): Promise<Member[]> {
  const membersRef = collection(db, getChurchPath(churchId), 'members');
  const snapshot = await getDocs(query(membersRef, orderBy('firstName')));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Member));
}

export async function getMember(churchId: string, memberId: string): Promise<Member | null> {
  const docRef = doc(db, getChurchPath(churchId), 'members', memberId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Member;
  }
  return null;
}

export async function getMembersByDepartment(churchId: string, departmentId: string): Promise<Member[]> {
  const membersRef = collection(db, getChurchPath(churchId), 'members');
  const q = query(membersRef, where('departmentId', '==', departmentId), orderBy('firstName'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Member));
}

// Helper to enrich members with fresh YTD absence counts
async function enrichMembersWithAbsenceCounts(
  churchId: string,
  members: Member[]
): Promise<Member[]> {
  const absenceCounts = await getYTDAbsenceCounts(churchId);

  return members.map((member) => ({
    ...member,
    absenceCount: absenceCounts[member.id] ?? 0,
    flagged: (absenceCounts[member.id] ?? 0) >= 2,
  }));
}

export async function getMembersWithAbsenceCounts(churchId: string): Promise<Member[]> {
  const members = await getMembers(churchId);
  return enrichMembersWithAbsenceCounts(churchId, members);
}

export async function getMembersByDepartmentWithAbsenceCounts(
  churchId: string,
  departmentId: string
): Promise<Member[]> {
  const members = await getMembersByDepartment(churchId, departmentId);
  return enrichMembersWithAbsenceCounts(churchId, members);
}

export async function createMember(
  churchId: string,
  data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'flagged'>
): Promise<string> {
  const membersRef = collection(db, getChurchPath(churchId), 'members');
  const docRef = await addDoc(membersRef, {
    ...data,
    flagged: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update department member count
  if (data.departmentId) {
    const deptRef = doc(db, getChurchPath(churchId), 'departments', data.departmentId);
    const deptDoc = await getDoc(deptRef);
    if (deptDoc.exists()) {
      await updateDoc(deptRef, {
        memberCount: (deptDoc.data().memberCount || 0) + 1,
      });
    }
  }

  return docRef.id;
}

export async function updateMember(
  churchId: string,
  memberId: string,
  data: Partial<Member>
): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'members', memberId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMember(churchId: string, memberId: string): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'members', memberId);

  // Get member to update department count
  const memberDoc = await getDoc(docRef);
  if (memberDoc.exists()) {
    const memberData = memberDoc.data();
    if (memberData.departmentId) {
      const deptRef = doc(db, getChurchPath(churchId), 'departments', memberData.departmentId);
      const deptDoc = await getDoc(deptRef);
      if (deptDoc.exists()) {
        await updateDoc(deptRef, {
          memberCount: Math.max(0, (deptDoc.data().memberCount || 0) - 1),
        });
      }
    }
  }

  await deleteDoc(docRef);
}

// ==================== ATTENDANCE ====================

export async function getAttendanceRecords(churchId: string, limitCount = 30): Promise<AttendanceRecord[]> {
  const attendanceRef = collection(db, getChurchPath(churchId), 'attendance');
  const q = query(attendanceRef, orderBy('date', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
}

export async function getAttendanceByDate(churchId: string, dateString: string): Promise<AttendanceRecord | null> {
  const docRef = doc(db, getChurchPath(churchId), 'attendance', dateString);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as AttendanceRecord;
  }
  return null;
}

export async function getMTDAttendance(churchId: string): Promise<{ presentMTD: number; absentMTD: number }> {
  const attendanceRef = collection(db, getChurchPath(churchId), 'attendance');

  // Get first day of current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const q = query(
    attendanceRef,
    where('date', '>=', Timestamp.fromDate(firstOfMonth)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);

  let presentMTD = 0;
  let absentMTD = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    presentMTD += data.presentCount || 0;
    absentMTD += data.absentCount || 0;
  });

  return { presentMTD, absentMTD };
}

export async function getYTDAbsenceCounts(churchId: string): Promise<Record<string, number>> {
  const attendanceRef = collection(db, getChurchPath(churchId), 'attendance');
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const q = query(
    attendanceRef,
    where('date', '>=', Timestamp.fromDate(startOfYear)),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  const absenceCounts: Record<string, number> = {};
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    Object.entries(data.records || {}).forEach(([memberId, record]) => {
      if (!(record as { present: boolean }).present) {
        absenceCounts[memberId] = (absenceCounts[memberId] || 0) + 1;
      }
    });
  });

  return absenceCounts;
}

export async function saveAttendance(
  churchId: string,
  dateString: string,
  records: Record<string, { present: boolean; note?: string }>
): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'attendance', dateString);

  let presentCount = 0;
  let absentCount = 0;
  Object.values(records).forEach((r) => {
    if (r.present) presentCount++;
    else absentCount++;
  });

  const existingDoc = await getDoc(docRef);
  const data = {
    date: Timestamp.fromDate(new Date(dateString)),
    dateString,
    records,
    presentCount,
    absentCount,
    updatedAt: serverTimestamp(),
  };

  if (existingDoc.exists()) {
    await updateDoc(docRef, data);
  } else {
    await addDoc(collection(db, getChurchPath(churchId), 'attendance'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }

  // Check and update flagged status for absent members
  await updateFlaggedMembers(churchId);
}

async function updateFlaggedMembers(churchId: string): Promise<void> {
  // Get YTD absence counts using shared function
  const absenceCounts = await getYTDAbsenceCounts(churchId);

  // Update flagged status AND absenceCount for all members
  const membersRef = collection(db, getChurchPath(churchId), 'members');
  const membersSnapshot = await getDocs(membersRef);

  const batch = writeBatch(db);
  membersSnapshot.docs.forEach((memberDoc) => {
    const memberId = memberDoc.id;
    const absenceCount = absenceCounts[memberId] || 0;
    const shouldBeFlagged = absenceCount >= 2;
    const currentData = memberDoc.data();

    // Update if absenceCount or flagged status changed
    if (absenceCount !== currentData.absenceCount || shouldBeFlagged !== currentData.flagged) {
      batch.update(memberDoc.ref, {
        flagged: shouldBeFlagged,
        absenceCount: absenceCount,
      });
    }
  });

  await batch.commit();
}

// ==================== TITHES ====================

export async function getTithes(churchId: string, month?: string): Promise<TitheRecord[]> {
  const tithesRef = collection(db, getChurchPath(churchId), 'tithes');
  let q;

  if (month) {
    q = query(tithesRef, where('month', '==', month), orderBy('date', 'desc'));
  } else {
    q = query(tithesRef, orderBy('date', 'desc'), limit(100));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TitheRecord));
}

export async function getYTDTithes(churchId: string): Promise<TitheRecord[]> {
  const tithesRef = collection(db, getChurchPath(churchId), 'tithes');
  const currentYear = new Date().getFullYear();
  const startOfYear = `${currentYear}-01`;
  const endOfYear = `${currentYear}-12`;

  const q = query(
    tithesRef,
    where('month', '>=', startOfYear),
    where('month', '<=', endOfYear),
    orderBy('month')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TitheRecord));
}

export async function getTithesByMember(churchId: string, memberId: string): Promise<TitheRecord[]> {
  const tithesRef = collection(db, getChurchPath(churchId), 'tithes');
  const q = query(tithesRef, where('memberId', '==', memberId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TitheRecord));
}

export async function createTithe(
  churchId: string,
  data: Omit<TitheRecord, 'id' | 'createdAt'>
): Promise<string> {
  const tithesRef = collection(db, getChurchPath(churchId), 'tithes');
  const docRef = await addDoc(tithesRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteTithe(churchId: string, titheId: string): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'tithes', titheId);
  await deleteDoc(docRef);
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats(churchId: string) {
  const [members, departments, mtdAttendance, ytdTithes, ytdAbsenceCounts] = await Promise.all([
    getMembers(churchId),
    getDepartments(churchId),
    getMTDAttendance(churchId),
    getYTDTithes(churchId),
    getYTDAbsenceCounts(churchId),
  ]);

  const genderCounts = { male: 0, female: 0 };
  const deptCounts: Record<string, number> = {};
  const membershipGrowth: Record<string, number> = {};

  members.forEach((m) => {
    // Count by gender
    if (m.gender === 'male') {
      genderCounts.male++;
    } else if (m.gender === 'female') {
      genderCounts.female++;
    }

    // Count by department
    if (m.departmentName) {
      deptCounts[m.departmentName] = (deptCounts[m.departmentName] || 0) + 1;
    }

    // Count by join month for growth chart
    if (m.joinedDate) {
      const joinDate = m.joinedDate.toDate();
      const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
      membershipGrowth[monthKey] = (membershipGrowth[monthKey] || 0) + 1;
    }
  });

  const ytdTotal = ytdTithes.reduce((sum, t) => sum + t.amount, 0);

  // Enrich members with computed YTD absence counts and filter those with 1+ absences
  const flaggedMembers = members
    .map((m) => ({
      ...m,
      absenceCount: ytdAbsenceCounts[m.id] ?? 0,
    }))
    .filter((m) => m.absenceCount >= 1);

  return {
    totalMembers: members.length,
    totalDepartments: departments.length,
    presentMTD: mtdAttendance.presentMTD,
    absentMTD: mtdAttendance.absentMTD,
    ytdTithes: ytdTotal,
    genderDistribution: genderCounts,
    membersByDepartment: deptCounts,
    membershipGrowth,
    flaggedMembers,
  };
}

// ==================== DANGER ZONE ====================

export async function deleteAdminAccount(uid: string): Promise<void> {
  const adminRef = doc(db, 'admins', uid);
  await deleteDoc(adminRef);
}

export async function deleteChurch(churchId: string): Promise<void> {
  const churchPath = getChurchPath(churchId);

  // Delete all subcollections
  const subcollections = ['departments', 'members', 'attendance', 'tithes'];

  for (const subcollection of subcollections) {
    const collRef = collection(db, churchPath, subcollection);
    const snapshot = await getDocs(collRef);

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
      await batch.commit();
    }
  }

  // Delete the church document itself
  const churchRef = doc(db, 'churches', churchId);
  await deleteDoc(churchRef);
}

// ==================== REGISTRATION TOKENS ====================

export async function createRegistrationToken(
  churchId: string,
  adminUid: string,
  expirationMinutes: number = 10
): Promise<string> {
  const tokensRef = collection(db, getChurchPath(churchId), 'registrationTokens');

  // Calculate expiration time at creation, not at validation time
  const expiresAt = Timestamp.fromMillis(Date.now() + expirationMinutes * 60 * 1000);

  const docRef = await addDoc(tokensRef, {
    churchId,
    createdBy: adminUid,
    createdAt: serverTimestamp(),
    expiresAt,
    expirationMinutes,
    isActive: true,
    usageCount: 0,
  });

  return docRef.id;
}

export async function getRegistrationToken(
  churchId: string,
  tokenId: string
): Promise<RegistrationToken | null> {
  const docRef = doc(db, getChurchPath(churchId), 'registrationTokens', tokenId);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as RegistrationToken;
  }
  return null;
}

export async function validateToken(
  churchId: string,
  tokenId: string
): Promise<{ valid: boolean; error?: string }> {
  const token = await getRegistrationToken(churchId, tokenId);

  if (!token) {
    return { valid: false, error: 'Token not found' };
  }

  if (!token.isActive) {
    return { valid: false, error: 'Token has been deactivated' };
  }

  // Use expiresAt directly - no calculation needed
  const now = Timestamp.now();
  if (token.expiresAt && now.toMillis() > token.expiresAt.toMillis()) {
    return { valid: false, error: 'Token has expired' };
  }

  return { valid: true };
}

export async function deactivateToken(churchId: string, tokenId: string): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'registrationTokens', tokenId);
  await updateDoc(docRef, { isActive: false });
}

export async function getActiveTokens(churchId: string): Promise<RegistrationToken[]> {
  const tokensRef = collection(db, getChurchPath(churchId), 'registrationTokens');
  const q = query(tokensRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RegistrationToken));
}

async function incrementTokenUsage(churchId: string, tokenId: string): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'registrationTokens', tokenId);
  const tokenDoc = await getDoc(docRef);

  if (tokenDoc.exists()) {
    await updateDoc(docRef, {
      usageCount: (tokenDoc.data().usageCount || 0) + 1,
    });
  }
}

// ==================== PENDING MEMBERS ====================

export async function getPublicDepartments(churchId: string): Promise<Department[]> {
  const deptRef = collection(db, getChurchPath(churchId), 'departments');
  const snapshot = await getDocs(query(deptRef, orderBy('name')));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Department));
}

export async function submitPendingMember(
  churchId: string,
  tokenId: string,
  data: Omit<PendingMember, 'id' | 'tokenId' | 'submittedAt' | 'status'>
): Promise<string> {
  const pendingRef = collection(db, getChurchPath(churchId), 'pendingMembers');

  const docRef = await addDoc(pendingRef, {
    ...data,
    tokenId,
    submittedAt: serverTimestamp(),
    status: 'pending',
  });

  // Increment token usage count (fail silently - public users can't update tokens)
  try {
    await incrementTokenUsage(churchId, tokenId);
  } catch {
    // Expected for public users - they don't have write access to tokens
  }

  return docRef.id;
}

export async function getPendingMembers(churchId: string): Promise<PendingMember[]> {
  const pendingRef = collection(db, getChurchPath(churchId), 'pendingMembers');
  const q = query(pendingRef, where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PendingMember));
}

export async function getPendingMembersCount(churchId: string): Promise<number> {
  const pendingRef = collection(db, getChurchPath(churchId), 'pendingMembers');
  const q = query(pendingRef, where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function approvePendingMember(
  churchId: string,
  pendingId: string,
  adminUid: string
): Promise<string> {
  const pendingRef = doc(db, getChurchPath(churchId), 'pendingMembers', pendingId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    throw new Error('Pending member not found');
  }

  const pendingData = pendingDoc.data() as PendingMember;

  // Create the actual member
  // Use submitted joinedDate and joinedVia if available, otherwise use defaults
  const memberId = await createMember(churchId, {
    firstName: pendingData.firstName,
    lastName: pendingData.lastName,
    email: pendingData.email || '',
    phone: pendingData.phone,
    gender: pendingData.gender,
    dob: pendingData.dob,
    joinedDate: pendingData.joinedDate || Timestamp.now(),
    joinedVia: pendingData.joinedVia || 'Self-Registration',
    departmentId: pendingData.departmentId,
    departmentName: pendingData.departmentName,
    residence: pendingData.residence || '',
    photoUrl: pendingData.photoUrl || '',
    notes: pendingData.notes || '',
  });

  // Update pending status
  await updateDoc(pendingRef, {
    status: 'approved',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
  });

  return memberId;
}

export async function rejectPendingMember(
  churchId: string,
  pendingId: string,
  adminUid: string,
  reason?: string
): Promise<void> {
  const pendingRef = doc(db, getChurchPath(churchId), 'pendingMembers', pendingId);

  await updateDoc(pendingRef, {
    status: 'rejected',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    rejectionReason: reason || '',
  });
}

export async function deletePendingMember(churchId: string, pendingId: string): Promise<void> {
  const docRef = doc(db, getChurchPath(churchId), 'pendingMembers', pendingId);
  await deleteDoc(docRef);
}

