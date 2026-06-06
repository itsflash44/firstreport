import type { CaseConversation, LegalCase as LegacyLegalCase } from '../lib/legalJourney';
import type { LangCode, PersonaId } from '../lib/i18n';

/**
 * The Intelligence Engine's formal output contract.
 * Aggregates confidence, readiness, contradictions, and next actions.
 */
export interface IntelligenceOutput {
  trustScore: number;           // 0-100 scale
  readinessScore: number;       // 0-100 scale
  confidenceScore: number;      // 0-100 scale
  intakeComplete: boolean;
  nextBestAction: {
    type: 'upload_doc' | 'answer_question' | 'verify_id' | 'file_complaint';
    label: string;
    priority: 'high' | 'medium' | 'low';
  };
  missingEvidence: Array<{
    type: string;               // e.g., 'medical_report', 'rc_book'
    reason: string;             // Context-aware reason
    critical: boolean;
  }>;
  contradictions: Array<{
    field: string;              // e.g., 'incident_date'
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
}

/**
 * Represents a structured fact extracted by the Case Memory Engine.
 */
export interface CaseFact {
  id: string;
  label: 'who' | 'what' | 'where' | 'when' | string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'transcript' | 'ocr' | 'user_input';
  timestamp: number;
}

/**
 * Defines the core interface for the V3 Case Engine.
 * Implemented by adapters initially, and natively later.
 */
export interface ICaseEngine {
  getCase(id: string): LegacyLegalCase | null;
  createCase(params: Partial<LegacyLegalCase>): LegacyLegalCase;
  updateCase(id: string, updates: Partial<LegacyLegalCase>): LegacyLegalCase | null;
  addConversationTurn(caseId: string, turn: CaseConversation): void;
  // Will be expanded with more V3-specific methods over time.
}
