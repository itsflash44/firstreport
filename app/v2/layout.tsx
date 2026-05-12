'use client';

import { AppShell } from '@/v2/components/shell/AppShell';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
