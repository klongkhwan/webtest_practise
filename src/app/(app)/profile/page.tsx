'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    <div className="page-container max-w-5xl">

        {/* Tabs */}
        <div className="flex mb-8 bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 ${
              activeTab === 'profile' 
                ? 'bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                : 'bg-transparent text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex-1 py-3 px-4 text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 ${
              activeTab === 'certificates' 
                ? 'bg-secondary-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                : 'bg-transparent text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
          >
            Certificates
          </button>
        </div>
        {activeTab === 'profile' && (
          <div className="bg-white border-2 border-black p-8 sm:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-10 border-b-2 border-black relative z-10">
              <div className="w-24 h-24 bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-serif text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-serif text-black">{user?.full_name}</h3>
                <p className="text-sm font-mono text-slate-500 mt-1 uppercase tracking-wider">{user?.email}</p>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-black bg-secondary-400 text-black font-bold">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>


            <form onSubmit={handleSave} className="space-y-6 relative z-10">
              <FormInput id="full_name" name="full_name" label="Full Name" type="text" value={formData.full_name} onChange={handleChange} error={fieldErrors.full_name} required />
              <FormInput id="phone" name="phone" label="Phone" type="tel" value={formData.phone} onChange={handleChange} error={fieldErrors.phone} maxLength={10} />
              <FormInput id="avatar_url" name="avatar_url" label="Avatar URL" type="url" value={formData.avatar_url} onChange={handleChange} error={fieldErrors.avatar_url} placeholder="https://example.com/avatar.jpg" />
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="px-8 py-3 border-2 border-black bg-secondary-400 text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            {certificates.length === 0 ? (
              <div className="bg-white border-2 border-black p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-black font-serif text-2xl mb-2">No certificates yet</p>
                <p className="font-mono text-sm text-slate-500">Complete a course to earn your first certificate</p>
              </div>
            ) : (
              <div className="space-y-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-white border-2 border-black p-6 sm:p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-16 h-16 bg-secondary-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl text-black mb-1">{cert.course?.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <p className="inline-block px-2 border border-black bg-slate-50 font-mono text-[10px] font-bold text-black uppercase tracking-widest leading-loose">
                          #{cert.certificate_number}
                        </p>
                        <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                          Successfully {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/certificates/${cert.id}`}
                      className="w-full sm:w-auto px-6 py-3 border-2 border-black bg-secondary-400 text-black font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-center"
                    >
                      View Certificate
                    </Link>
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
