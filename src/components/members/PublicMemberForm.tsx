'use client';

import { useState, FormEvent, useRef } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { Department, PublicRegistrationFormData } from '@/lib/types';

interface PublicMemberFormProps {
  departments: Department[];
  onSubmit: (data: PublicRegistrationFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function PublicMemberForm({
  departments,
  onSubmit,
  loading = false,
  error: externalError,
}: PublicMemberFormProps) {
  const [formData, setFormData] = useState<PublicRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: undefined,
    dob: '',
    joinedDate: new Date().toISOString().slice(0, 10),
    joinedVia: '',
    departmentId: '',
    residence: '',
    notes: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof PublicRegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.firstName.trim()) {
        throw new Error('First name is required');
      }
      if (!formData.lastName.trim()) {
        throw new Error('Last name is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!formData.departmentId) {
        throw new Error('Please select a department');
      }
      if (!formData.joinedVia) {
        throw new Error('Please select how you found us');
      }

      if (formData.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          throw new Error('Please enter a valid email address');
        }
      }

      await onSubmit({ ...formData, photo: photo || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit registration');
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const genderOptions = [
    { value: '', label: 'Select...' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const joinedViaOptions = [
    { value: '', label: 'Select...' },
    { value: 'Walk-in', label: 'Walk-in' },
    { value: 'Invitation', label: 'Invitation' },
    { value: 'Crusade', label: 'Crusade' },
    { value: 'Online', label: 'Online' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Other', label: 'Other' },
  ];

  const displayError = error || externalError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {displayError && (
        <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{displayError}</p>
        </div>
      )}

      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-brand-500/50 transition-colors overflow-hidden flex-shrink-0"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">Profile Photo</p>
          <p className="text-xs text-slate-400 mt-1">Click to upload (optional, max 5MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          placeholder="Yaa"
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          placeholder="Mansah"
          required
        />
      </div>

      {/* Gender */}
      <Select
        label="Gender"
        options={genderOptions}
        value={formData.gender || ''}
        onChange={(e) => handleChange('gender', e.target.value)}
        required
      />

      {/* Contact fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full overflow-hidden">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Phone
          </label>
          <div className="flex">
            <span className="flex-shrink-0 inline-flex items-center px-4 bg-white/10 border border-r-0 border-white/10 rounded-l-xl text-text-secondary">
              +233
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="XX XXX XXXX"
              required
              maxLength={9}
              className="w-full min-w-0 h-12 bg-white/5 text-white border border-white/10 rounded-r-xl px-4 placeholder:text-text-placeholder hover:border-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-colors duration-200"
            />
          </div>
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Email <span className="text-slate-500">(optional)</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="yaa@example.com"
          />
        </div>
      </div>

      {/* Date fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={formData.dob}
          onChange={(e) => handleChange('dob', e.target.value)}
        />
        <Input
          label="Joined Date"
          type="date"
          value={formData.joinedDate}
          onChange={(e) => handleChange('joinedDate', e.target.value)}
          required
        />
      </div>

      {/* Department and joined via */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Department"
          options={departmentOptions}
          value={formData.departmentId}
          onChange={(e) => handleChange('departmentId', e.target.value)}
          placeholder="Select department"
          required
        />
        <Select
          label="How did you find us?"
          options={joinedViaOptions}
          value={formData.joinedVia}
          onChange={(e) => handleChange('joinedVia', e.target.value)}
          required
        />
      </div>

      {/* Residence */}
      <Input
        label="Residence"
        value={formData.residence}
        onChange={(e) => handleChange('residence', e.target.value)}
        placeholder="City, Area"
      />

      {/* Notes */}
      <div className="w-full">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any additional information..."
          rows={3}
          className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 placeholder:text-text-placeholder hover:border-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-colors duration-200 resize-none"
        />
      </div>

      {/* Submit button */}
      <Button type="submit" loading={loading} loadingText="Submitting..." className="w-full">
        Submit Registration
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Your registration will be reviewed by a church administrator before being approved.
      </p>
    </form>
  );
}

PublicMemberForm.displayName = 'PublicMemberForm';
