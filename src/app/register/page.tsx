'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase/client';
import { FormInput } from '@/components/FormInput';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Please enter your full name';
    }
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address (e.g., name@example.com)';
      }
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your phone number';
    } else {
      // Phone validation - exactly 10 digits
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }
    if (!formData.password) {
      errors.password = 'Please enter your password';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    }
    if (!formData.terms) {
      errors.terms = 'Please accept the Terms and Privacy Policy';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      // 2. Create user profile in database
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'STUDENT',
          is_phone_verified: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      // Redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const termsContent = `Terms of Service

1. Acceptance of Terms
By accessing and using this LMS platform, you agree to be bound by these Terms of Service.

2. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

3. Course Content
All course content is provided for educational purposes. You may not reproduce, distribute, or create derivative works without permission.

4. Code of Conduct
Users must maintain respectful behavior and comply with all applicable laws and regulations.

5. Privacy
Your personal information is handled according to our Privacy Policy.

6. Termination
We reserve the right to terminate accounts that violate these terms.`;

  const privacyContent = `Privacy Policy

1. Information Collection
We collect personal information including name, email, phone number, and learning progress data.

2. Use of Information
Your information is used to provide educational services, track progress, and communicate with you.

3. Data Security
We implement appropriate security measures to protect your personal information.

4. Third-Party Services
We may use third-party services (like Supabase) for data storage and authentication.

5. Cookies
We use cookies to maintain your session and improve user experience.

6. Data Retention
Your data is retained as long as your account is active or as required by law.

7. Your Rights
You have the right to access, modify, or delete your personal information.`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 bg-secondary-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900">LMS</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-xl sm:px-10">
          <form onSubmit={handleRegister} className="space-y-5">
            <FormInput
              id="fullName"
              name="fullName"
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={fieldErrors.fullName}
              required
            />

            <FormInput
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              error={fieldErrors.email}
              required
            />

            <div>
              <FormInput
                id="phone"
                name="phone"
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                maxLength={10}
                error={fieldErrors.phone}
                required
              />        
            </div>

            <FormInput
              id="password"
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              error={fieldErrors.password}
              required
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Enter password again"
              error={fieldErrors.confirmPassword}
              required
            />

            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className={`h-4 w-4 mt-0.5 text-secondary-700 focus:ring-secondary-500 border-gray-300 rounded ${fieldErrors.terms ? 'border-red-500' : ''}`}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-secondary-700 hover:text-secondary-500 underline"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-secondary-700 hover:text-secondary-500 underline"
                >
                  Privacy Policy
                </button>{' '}
                <span className="text-red-500">*</span>
              </label>
            </div>
            {fieldErrors.terms && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-xs text-red-600">{fieldErrors.terms}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-700 hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-secondary-700 hover:text-secondary-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Terms of Service</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{termsContent}</pre>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full btn-primary"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{privacyContent}</pre>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full btn-primary"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
