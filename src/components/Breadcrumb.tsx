'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-[10px] mb-8 flex-wrap font-mono font-bold uppercase tracking-widest border-b-2 border-black pb-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg className="w-3 h-3 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-slate-500 hover:text-black transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className={`truncate max-w-[200px] ${index === items.length - 1 ? 'text-black bg-secondary-400 border border-black px-2 py-0.5' : 'text-slate-500'}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
