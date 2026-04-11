'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback, useRef } from 'react';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useLayoutUser } from '@/components/AppLayout';
import Link from 'next/link';

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const certId = params.id as string;
  const { setPageLoading } = useLayoutUser();
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchCertificate = useCallback(async () => {
    try {
      const resp = await fetch(`/api/certificates`);
      if (!resp.ok) throw new Error('Failed to load certificates');
      const data = await resp.json();
      const cert = data.certificates.find((c: any) => c.id === certId);
      
      if (!cert) throw new Error('Certificate not found');
      
      setCertificate(cert);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPageLoading(false);
    }
  }, [certId, setPageLoading]);

  useFetchOnce(fetchCertificate, [certId]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Error</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="page-container !max-w-6xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 print:hidden">
        <div>
          <button 
            onClick={handleBack}
            className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-slate-600 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Course
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Certificate</h1>
          <p className="text-slate-500 mt-1">Official recognition of your learning achievement.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download / Print
          </button>
        </div>
      </div>

      <div className="bg-slate-100/50 p-4 sm:p-12 rounded-[40px] border border-white/50 print:bg-white print:p-0 print:border-0 relative">
        {/* Certificate Content */}
        <div ref={printRef} className="bg-white mx-auto shadow-2xl relative overflow-hidden aspect-[1.414/1] w-full max-w-[1000px] border-[12px] border-double border-slate-100 print:shadow-none print:border-0 print:max-w-none">
          
          {/* Decorative Corner Backgrounds */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -mr-16 -mt-16 rounded-full opacity-50 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-50 -ml-16 -mb-16 rounded-full opacity-50 blur-3xl pointer-events-none" />

          {/* Golden Border Accents */}
          <div className="absolute inset-0 m-4 border border-slate-200 pointer-events-none" />
          <div className="absolute inset-0 m-8 border-4 border-slate-50 pointer-events-none" />

          {/* Main Layout */}
          <div className="relative z-10 h-full flex flex-col p-12 sm:p-24 text-center items-center justify-between">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                <div className="w-10 h-1 bg-slate-300" />
                <span className="uppercase tracking-[0.4em] text-[10px] font-black text-slate-400">Certificate of Completion</span>
                <div className="w-10 h-1 bg-slate-300" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-serif text-slate-800 italic mb-2">Completion Record</h2>
            </div>

            {/* Recipient */}
            <div className="my-8">
              <p className="text-slate-400 font-medium mb-6 uppercase tracking-widest text-xs">This is to certify that</p>
              <h3 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                {certificate.user?.full_name || 'Student Name'}
              </h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto" />
            </div>

            {/* Course Title */}
            <div className="max-w-2xl px-8">
              <p className="text-slate-500 font-medium mb-4 leading-relaxed">
                has successfully completed all requirements and assessments for the course
              </p>
              <h4 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight tracking-tight px-4 py-2 border-b-2 border-slate-50 inline-block">
                {certificate.course?.title}
              </h4>
            </div>

            {/* Footer with Signatures/Verification */}
            <div className="w-full flex justify-between items-end mt-12 sm:mt-20">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Issued On</p>
                <p className="text-sm font-bold text-slate-700">
                   {new Date(certificate.issued_at).toLocaleDateString('en-US', { 
                     month: 'long', 
                     day: 'numeric', 
                     year: 'numeric' 
                   })}
                </p>
              </div>

              <div className="relative">
                {/* Simulated Seal */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center -mb-8 rotate-12 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50">
                   <div className="text-center">
                     <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Verified</div>
                     <div className="text-slate-800 font-black text-xl leading-none">AG</div>
                     <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Institute</div>
                   </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Certificate ID</p>
                <p className="text-xs font-mono font-bold text-slate-400">
                  {certificate.certificate_number}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print-only CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .page-container,
          .page-container * {
            visibility: visible;
          }
          .page-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
