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
    <nav className="flex items-center gap-1.5 text-sm mb-2 flex-wrap">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-slate-400 hover:text-secondary-600 font-medium transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-semibold truncate max-w-[200px] ${index === items.length - 1 ? 'text-slate-700' : 'text-slate-400'}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
