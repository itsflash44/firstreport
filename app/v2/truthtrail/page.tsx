'use client';

import { useMemo } from 'react';
import { useSessionStore } from '@/v2/stores/session-store';
import { useAppStore } from '@/v2/stores/app-store';
import { TimelineStep } from '@/v2/components/truthtrail/TimelineStep';
import { TrustScore } from '@/v2/components/truthtrail/TrustScore';
import { TrailNarrative } from '@/v2/components/truthtrail/TrailNarrative';
import { t } from '@/v2/types/i18n';
import type { TimelineStepData } from '@/v2/components/truthtrail/TimelineStep';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TruthTrailPage() {
  const session = useSessionStore((s) => s.activeSession);
  const language = useAppStore((s) => s.language);

  const steps = useMemo((): TimelineStepData[] => {
    if (!session) return [];

    const result: TimelineStepData[] = [
      {
        title: 'Session Started',
        description: `Language: ${session.language} | Persona: ${session.personaId}`,
        timestamp: formatTime(session.createdAt),
        status: 'completed',
        icon: '1',
      },
    ];

    const userTurns = session.transcript.filter((t) => t.role === 'user').length;
    if (userTurns > 0) {
      result.push({
        title: 'Voice Interview',
        description: `${userTurns} exchanges recorded. Incident details captured via voice.`,
        timestamp: formatTime(session.transcript[session.transcript.length - 1]?.timestamp ?? session.updatedAt),
        status: session.status === 'interviewing' ? 'active' : 'completed',
        icon: '2',
      });
    }

    if (session.classification) {
      result.push({
        title: `BNSS ${session.classification.bnss_section}`,
        description: `${session.classification.offense_name_english} — ${session.classification.confidence} confidence`,
        timestamp: formatTime(session.updatedAt),
        status: 'completed',
        icon: '3',
      });
    } else if (['classified', 'documents_ready', 'sent'].includes(session.status)) {
      result.push({
        title: 'Classification',
        description: 'Analyzing incident under BNSS 2023…',
        timestamp: '',
        status: 'active',
        icon: '3',
      });
    }

    if (session.documents.length > 0) {
      result.push({
        title: 'Documents Generated',
        description: `${session.documents.length} document(s) prepared for submission`,
        timestamp: session.documents[0]?.generatedAt ? formatTime(session.documents[0].generatedAt) : '',
        status: 'completed',
        icon: '4',
      });
    }

    if (session.status === 'sent') {
      result.push({
        title: 'Delivered via Telegram',
        description: 'Documents sent successfully to designated authority',
        timestamp: formatTime(session.updatedAt),
        status: 'completed',
        icon: '5',
      });
    }

    return result;
  }, [session]);

  if (!session) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <p className="text-sm text-text-secondary text-center py-12">
          No active case to display.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-display font-semibold text-navy">
          TruthTrail
        </h1>
        <p className="text-xs text-text-secondary">
          Your case journey — transparent and accountable
        </p>
      </div>

      {session.classification && (
        <TrustScore
          confidence={session.classification.confidence}
          section={session.classification.bnss_section}
        />
      )}

      <div className="pt-2">
        {steps.map((step, i) => (
          <TimelineStep
            key={i}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>

      <TrailNarrative
        title="How This System Works"
        paragraphs={[
          'FirstReport uses AI to understand your incident description and classify it under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.',
          'Your voice recording is transcribed, analyzed, and matched to the relevant legal section. All processing respects your privacy.',
          'Documents are generated locally and delivered via Telegram to ensure accessibility even in areas with limited connectivity.',
        ]}
      />

      <p className="text-xs text-text-muted text-center leading-relaxed">
        {t('disclaimer', language)}
      </p>
    </div>
  );
}
