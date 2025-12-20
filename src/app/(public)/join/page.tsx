'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui';
import PublicMemberForm from '@/components/members/PublicMemberForm';
import { validateToken, getPublicDepartments, submitPendingMember } from '@/lib/firebase/firestore';
import { uploadPendingMemberPhoto } from '@/lib/firebase/storage';
import { Department, PublicRegistrationFormData } from '@/lib/types';

function JoinPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');

  // Parse token: {churchId}_{tokenId}
  const [churchId, tokenId] = token?.split('_') || [null, null];

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      if (!churchId || !tokenId) {
        setTokenError('Invalid registration link');
        setValidating(false);
        return;
      }

      try {
        const result = await validateToken(churchId, tokenId);

        if (result.valid) {
          setTokenValid(true);
          // Load departments
          const depts = await getPublicDepartments(churchId);
          setDepartments(depts);
        } else {
          setTokenError(result.error || 'Invalid token');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenError('Unable to validate registration link');
      } finally {
        setValidating(false);
      }
    }

    validate();
  }, [churchId, tokenId]);

  const handleSubmit = async (formData: PublicRegistrationFormData) => {
    if (!churchId || !tokenId) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Generate a temporary ID for photo upload
      const tempId = `pending_${Date.now()}`;

      let photoUrl: string | undefined;
      if (formData.photo) {
        photoUrl = await uploadPendingMemberPhoto(churchId, tempId, formData.photo);
      }

      const dept = departments.find((d) => d.id === formData.departmentId);

      await submitPendingMember(churchId, tokenId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
        departmentId: formData.departmentId,
        departmentName: dept?.name || '',
        residence: formData.residence,
        notes: formData.notes,
        photoUrl,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-400">Validating registration link...</p>
        </div>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Registration Link Invalid</h2>
        <p className="text-slate-400">{tokenError}</p>
        <p className="text-sm text-slate-500 mt-4">
          Please contact your church administrator for a new registration link.
        </p>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Registration Submitted!</h2>
        <p className="text-slate-400">
          Thank you for registering. Your submission is pending approval by a church administrator.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          You may close this page now.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Registration</CardTitle>
        <p className="text-slate-400 text-sm mt-1">
          Fill out the form below to register as a member
        </p>
      </CardHeader>
      <CardContent>
        <PublicMemberForm
          departments={departments}
          onSubmit={handleSubmit}
          loading={submitting}
          error={submitError}
        />
      </CardContent>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </Card>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
