import type { Metadata } from 'next';
import { Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'LMS - Premium Framework',
  description: 'Master new technical paradigms through structured editorial learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${jetbrainsMono.variable} font-sans`}>{children}</body>
    </html>
  );
}
