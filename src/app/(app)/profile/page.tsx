'use client';

import { useEffect, useState } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useLayoutUser } from '@/components/AppLayout';
import { Snackbar } from '@/components/Snackbar';
import { FormInput } from '@/components/FormInput';
import type { Certificate } from '@/types/database';

export default function ProfilePage() {
  const { user, setPageLoading } = useLayoutUser();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({ full_name: '', phone: '', avatar_url: '' });
  const [activeTab, setActiveTab] = useState<'profile' | 'certificates'>('profile');

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  useFetchOnce(fetchCertificates, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Please enter your full name';
    if (formData.phone && formData.phone.replace(/\D/g, '').length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      setSnackbar({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err: unknown) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="page-container max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'certificates' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            Certificates
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="card p-8">
            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-secondary-500/20">
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
                <span className="badge-blue mt-2">{user?.role}</span>
              </div>
            </div>


            <form onSubmit={handleSave} className="space-y-6">
              <FormInput id="full_name" name="full_name" label="Full Name" type="text" value={formData.full_name} onChange={handleChange} error={fieldErrors.full_name} required />
              <FormInput id="phone" name="phone" label="Phone" type="tel" value={formData.phone} onChange={handleChange} error={fieldErrors.phone} maxLength={10} />
              <FormInput id="avatar_url" name="avatar_url" label="Avatar URL" type="url" value={formData.avatar_url} onChange={handleChange} error={fieldErrors.avatar_url} placeholder="https://example.com/avatar.jpg" />
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="btn-primary py-2.5 px-8 text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            {certificates.length === 0 ? (
              <div className="card empty-state">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-5">
                  <svg className="w-10 h-10 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-semibold text-lg">No certificates yet</p>
                <p className="text-slate-400 text-sm mt-1">Complete a course to earn your first certificate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="card p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{cert.course?.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">Certificate #{cert.certificate_number}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Issued {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>

    <Snackbar
      message={snackbar?.message || ''}
      type={snackbar?.type || 'success'}
      onClose={() => setSnackbar(null)}
    />
    </>
  );
}
