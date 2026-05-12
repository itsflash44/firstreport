'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/v2/stores/session-store';
import { IntakeFlow } from '@/v2/components/workspace/IntakeFlow';

export default function V2Home() {
  const router = useRouter();
  const activeSession = useSessionStore((s) => s.activeSession);

  useEffect(() => {
    if (!activeSession) return;

    switch (activeSession.status) {
      case 'interviewing':
        router.replace('/v2/chat');
        break;
      case 'classified':
        router.replace('/v2/classify');
        break;
      case 'documents_ready':
      case 'sent':
        router.replace('/v2/documents');
        break;
    }
  }, [activeSession, router]);

  if (activeSession && activeSession.status !== 'draft') {
    return null;
  }

  return <IntakeFlow />;
}
