/**
 * DEPRECATED — Ollama/local AI layer removed.
 * The app now uses Gemma 3 via Google AI Studio (lib/ai.ts).
 * Stubs kept only so old imports compile without errors.
 */

export type AIModel    = string;
export type AIProvider = 'gemma-cloud';

export interface LocalAIStatus {
  available:      false;
  endpoint:       string;
  models:         [];
  preferredModel: null;
  lastChecked:    number;
  error?:         string;
}

export interface AIRouteDecision {
  provider:  AIProvider;
  model:     string;
  reason:    string;
  isPrivate: boolean;
}

/** Always returns unavailable — Ollama is no longer used. */
export async function detectOllama(): Promise<LocalAIStatus> {
  return {
    available:      false,
    endpoint:       '',
    models:         [],
    preferredModel: null,
    lastChecked:    Date.now(),
    error:          'Ollama removed — using Gemma via Google AI Studio',
  };
}

export function routeAI(): AIRouteDecision {
  return {
    provider:  'gemma-cloud',
    model:     'gemma-3-4b-it',
    reason:    'Gemma 3 via Google AI Studio',
    isPrivate: false,
  };
}

export interface ChatMessage { role: string; content: string; }
export interface StreamChunk { text: string; done: boolean;  }

export async function* ollamaChat(): AsyncGenerator<StreamChunk> {
  yield { text: '', done: true };
}

export function buildLegalSystemPrompt(language: string): string {
  return language === 'hi-IN'
    ? 'आप FirstReport के AI सहायक हैं।'
    : "You are FirstReport's AI assistant.";
}

export const OLLAMA_SETUP_STEPS = {};
