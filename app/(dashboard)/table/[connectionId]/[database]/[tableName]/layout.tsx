'use client';

import { AppLayout } from '@/components/AppLayout';

export default function TableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}