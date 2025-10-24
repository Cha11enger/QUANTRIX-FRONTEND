'use client';

import { AppLayout } from '@/components/AppLayout';

interface TableLayoutProps {
  children,
}

export default function TableLayout({
  children,
}: TableLayoutProps & {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}