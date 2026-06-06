import { getLegalCase as getCase, updateCase } from '../lib/legalJourney';
import type { CaseFact } from '../types';

/**
 * Confidence Engine
 * Calculates whether the system has collected enough reliable information to classify the incident.
 * Drives the chat loop completion instead of a hard turn limit.
 */
export class ConfidenceEngine {
  
  canConcludeIntake(
    facts: CaseFact[], 
    turnCount: number,
    contradictions: any[] = []
  ): { canConclude: boolean; missingCritical: string[]; confidenceScore: number } {
    
    let confidenceScore = 100;
    const missingCritical: string[] = [];
    
    // We always require a minimum of 2 turns to ensure the user has had a chance to speak.
    if (turnCount < 2) {
      return { canConclude: false, missingCritical: ['Need more context from user'], confidenceScore: 0 };
    }

    // Check for critical missing facts (Who, What, When, Where)
    const hasDate = facts.some(f => f.label === 'date' || f.label === 'time');
    const hasLocation = facts.some(f => f.label === 'location' || f.label === 'station');
    
    if (!hasDate) {
      missingCritical.push('date/time');
      confidenceScore -= 30;
    }
    if (!hasLocation) {
      missingCritical.push('location/station');
      confidenceScore -= 30;
    }

    let hasSevereContradictions = false;
    for (const c of contradictions) {
      if (c.severity === 'high') {
        hasSevereContradictions = true;
        confidenceScore -= 40;
      } else if (c.severity === 'medium') {
        confidenceScore -= 20;
      } else {
        confidenceScore -= 5;
      }
    }

    const canConclude = missingCritical.length === 0 && !hasSevereContradictions;

    return {
      canConclude,
      missingCritical,
      confidenceScore: Math.max(0, confidenceScore)
    };
  }

  /**
   * Generates a follow-up question based on missing facts.
   */
  generateFollowUpPrompt(missingCritical: string[]): string {
    if (missingCritical.includes('date/time')) {
      return 'When exactly did this incident happen?';
    }
    if (missingCritical.includes('location/station')) {
      return 'Where did this happen, or which police station are you at?';
    }
    return 'Could you tell me a bit more about what happened?';
  }
}

export const confidenceEngine = new ConfidenceEngine();
