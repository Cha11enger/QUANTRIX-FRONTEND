'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { debug } from '@/lib/debug';

export function Providers({ children }: { children: ReactNode }) {
  debug.log('Providers rendered');
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}