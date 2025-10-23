import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { debug } from '@/lib/debug';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Database Manager Pro',
  description: 'Modern multi-database connection management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  debug.log('RootLayout rendered');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}