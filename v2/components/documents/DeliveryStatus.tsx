'use client';

import type { DocFlowState } from '../../hooks/use-document-flow';

interface DeliveryStatusProps {
  state: DocFlowState;
  error: string | null;
}

const STATE_CONFIG: Record<DocFlowState, { label: string; color: string; icon: string }> = {
  idle: { label: '', color: '', icon: '' },
  generating: { label: 'Generating PDF…', color: 'text-yellow-700 bg-yellow-50', icon: '⏳' },
  sending: { label: 'Sending via Telegram…', color: 'text-blue-700 bg-blue-50', icon: '📤' },
  queued: { label: 'Queued for delivery', color: 'text-orange-700 bg-orange-50', icon: '📋' },
  sent: { label: 'Sent successfully', color: 'text-green-700 bg-green-50', icon: '✅' },
  error: { label: 'Delivery failed', color: 'text-red-700 bg-red-50', icon: '❌' },
};

export function DeliveryStatus({ state, error }: DeliveryStatusProps) {
  if (state === 'idle') return null;

  const config = STATE_CONFIG[state];

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${config.color}`} role="status">
      <span role="img" aria-hidden="true">{config.icon}</span>
      <span className="font-medium">{config.label}</span>
      {error && <span className="text-xs opacity-75">— {error}</span>}
    </div>
  );
}
