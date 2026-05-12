'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '../../stores/session-store';
import type { SessionStatus } from '../../types/index';

const ROUTE_REQUIREMENTS: Record<string, SessionStatus[]> = {
  '/v2/classify': ['classified', 'documents_ready', 'sent'],
  '/v2/documents': ['documents_ready', 'sent'],
};

export function NavGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((s) => s.activeSession?.status);

  useEffect(() => {
    const required = ROUTE_REQUIREMENTS[pathname];
    if (!required) return;
    if (!status || !required.includes(status)) {
      router.replace('/v2');
    }
  }, [pathname, status, router]);

  const required = ROUTE_REQUIREMENTS[pathname];
  if (required && (!status || !required.includes(status))) {
    return null;
  }

  return <>{children}</>;
}
