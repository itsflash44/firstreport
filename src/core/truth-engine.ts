import type { CaseFact, IntelligenceOutput } from '../types';
import { memoryEngine } from './case-memory-engine';

/**
 * Truth Engine
 * Analyzes case facts to detect contradictions or timeline inconsistencies.
 */
export class TruthEngine {
  
  /**
   * Evaluates facts to find contradictions.
   */
  async evaluateContradictions(caseId: string, facts: CaseFact[]): Promise<IntelligenceOutput['contradictions']> {
    const contradictions: IntelligenceOutput['contradictions'] = [];
    
    // Group facts by label
    const grouped = new Map<string, string[]>();
    for (const fact of facts) {
      const existing = grouped.get(fact.label) || [];
      existing.push(fact.value);
      grouped.set(fact.label, existing);
    }

    // Look for multiple differing values for the same label
    for (const [field, values] of grouped.entries()) {
      const uniqueVals = [...new Set(values.map(v => v.toLowerCase().trim()))];
      
      if (uniqueVals.length > 1) {
        contradictions.push({
          field,
          description: `Conflicting information detected: ${uniqueVals.join(' vs ')}`,
          severity: (field === 'date' || field === 'time') ? 'high' : 'medium'
        });
      }
    }

    return contradictions;
  }
}

export const truthEngine = new TruthEngine();
