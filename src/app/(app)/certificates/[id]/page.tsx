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
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-slate-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-6"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Certificate</h1>
          <p className="text-slate-500 font-mono text-xs mt-1 uppercase tracking-wider">Official learning achievement</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-secondary-400 border-2 border-black text-black font-mono text-[10px] uppercase font-bold tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            PRINT / DOWNLOAD
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative print:border-0 print:shadow-none print:p-0">
        {/* Certificate Content */}
        <div ref={printRef} className="bg-white mx-auto relative overflow-hidden aspect-[1.414/1] w-full max-w-[1000px] border-[12px] border-black print:border-0">
          
          {/* Decorative Corner Backgrounds */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400 -mr-16 -mt-16 rotate-45 opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400 -ml-16 -mb-16 rotate-45 opacity-20 pointer-events-none" />

          {/* Golden Border Accents */}
          <div className="absolute inset-0 m-4 border border-slate-200 pointer-events-none" />
          <div className="absolute inset-0 m-8 border-4 border-slate-50 pointer-events-none" />

          {/* Main Layout */}
          <div className="relative z-10 h-full flex flex-col p-12 sm:p-24 text-center items-center justify-between">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-12 h-1 bg-black" />
                <span className="uppercase tracking-[0.4em] text-[10px] font-black text-black">Certificate of Completion</span>
                <div className="w-12 h-1 bg-black" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-black uppercase mb-2 tracking-tight">Record of Achievement</h2>
            </div>

            {/* Recipient */}
            <div className="my-8">
              <p className="text-slate-500 font-mono text-[10px] mb-6 uppercase tracking-widest font-bold">This is to certify that</p>
              <h3 className="text-5xl sm:text-7xl font-black text-black leading-tight mb-6 tracking-tighter uppercase">
                {certificate.user?.full_name || 'Student Name'}
              </h3>
              <div className="w-32 h-1 bg-black mx-auto" />
            </div>

            {/* Course Title */}
            <div className="max-w-2xl px-8">
              <p className="text-slate-600 font-mono text-xs uppercase tracking-wide mb-4">
                has successfully completed all requirements and assessments for the course
              </p>
              <h4 className="text-2xl sm:text-4xl font-black text-black leading-tight tracking-tight px-6 py-3 border-2 border-black inline-block bg-primary-400 uppercase">
                {certificate.course?.title}
              </h4>
            </div>

            {/* Footer with Signatures/Verification */}
            <div className="w-full flex justify-between items-end mt-12 sm:mt-20">
              <div className="text-left">
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2 font-mono">Issued On</p>
                <p className="text-sm font-black text-black font-mono">
                   {new Date(certificate.issued_at).toLocaleDateString('en-US', { 
                     month: 'long', 
                     day: 'numeric', 
                     year: 'numeric' 
                   }).toUpperCase()}
                </p>
              </div>

              <div className="relative">
                {/* Simulated Seal */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-black flex items-center justify-center -mb-8 rotate-12 bg-secondary-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <div className="text-center">
                     <div className="text-[8px] font-black text-black uppercase tracking-tighter font-mono">Verified</div>
                     <div className="text-black font-black text-2xl leading-none">AG</div>
                     <div className="text-[8px] font-black text-black uppercase tracking-tighter font-mono">Institute</div>
                   </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2 font-mono">Certificate ID</p>
                <p className="text-xs font-mono font-black text-black">
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
