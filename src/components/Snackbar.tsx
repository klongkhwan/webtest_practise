'use client';

import { useEffect, useState } from 'react';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarProps {
  message: string;
  type?: SnackbarType;
  duration?: number;
  onClose: () => void;
}

export function Snackbar({ message, type = 'success', duration = 3000, onClose }: SnackbarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const styles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-700 text-white',
  };

  return (
    <div className={`fixed bottom-6 left-1/2 z-[60] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 -translate-x-1/2' : 'opacity-0 translate-y-4 -translate-x-1/2'}`}>
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg shadow-black/15 ${styles[type]}`}>
        <span className="shrink-0">{icons[type]}</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="shrink-0 ml-2 p-0.5 rounded-lg hover:bg-white/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
