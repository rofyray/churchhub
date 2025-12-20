'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMembers, getMembersByDepartment, createMember, updateMember, deleteMember } from '@/lib/firebase/firestore';
import { Member, MemberFormData } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export function useMembers(departmentId?: string) {
  const { adminData } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const churchId = adminData?.churchId || '';

  const fetchMembers = useCallback(async () => {
    if (!churchId) return;

    setLoading(true);
    setError(null);

    try {
      const data = departmentId
        ? await getMembersByDepartment(churchId, departmentId)
        : await getMembers(churchId);
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [churchId, departmentId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (formData: MemberFormData, departmentName: string, photoUrl?: string) => {
    if (!churchId) throw new Error('No church ID');

    const memberData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || '',
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
      joinedDate: formData.joinedDate ? Timestamp.fromDate(new Date(formData.joinedDate)) : null,
      joinedVia: formData.joinedVia || '',
      departmentId: formData.departmentId,
      departmentName: departmentName,
      residence: formData.residence || '',
      photoUrl: photoUrl || '',
      notes: formData.notes || '',
    };

    const id = await createMember(churchId, memberData);
    await fetchMembers();
    return id;
  };

  const editMember = async (memberId: string, formData: Partial<MemberFormData>, departmentName?: string, photoUrl?: string) => {
    if (!churchId) throw new Error('No church ID');

    const updates: Partial<Member> = {};

    if (formData.firstName !== undefined) updates.firstName = formData.firstName;
    if (formData.lastName !== undefined) updates.lastName = formData.lastName;
    if (formData.email !== undefined) updates.email = formData.email;
    if (formData.phone !== undefined) updates.phone = formData.phone;
    if (formData.gender !== undefined) updates.gender = formData.gender;
    if (formData.dob !== undefined) {
      updates.dob = formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null;
    }
    if (formData.joinedDate !== undefined) {
      updates.joinedDate = formData.joinedDate ? Timestamp.fromDate(new Date(formData.joinedDate)) : null;
    }
    if (formData.joinedVia !== undefined) updates.joinedVia = formData.joinedVia;
    if (formData.departmentId !== undefined) updates.departmentId = formData.departmentId;
    if (departmentName !== undefined) updates.departmentName = departmentName;
    if (formData.residence !== undefined) updates.residence = formData.residence;
    if (formData.notes !== undefined) updates.notes = formData.notes;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;

    await updateMember(churchId, memberId, updates);
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    if (!churchId) throw new Error('No church ID');
    await deleteMember(churchId, memberId);
    await fetchMembers();
  };

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    editMember,
    removeMember,
  };
}
