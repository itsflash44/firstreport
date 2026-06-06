import { getLegalCase as getCase, updateCase } from '../lib/legalJourney';
import type { CaseFact } from '../types';
import { getDB } from '../lib/db/dexie';

/**
 * Case Memory Engine
 * Extracts and stores structured facts (entities) from unstructured case data 
 * like chat transcripts and OCR results. Provides a persistent factual memory layer.
 */
export class CaseMemoryEngine {
  
  /**
   * Extracts entities from the latest conversation turns and stores them.
   * In a full implementation, this might call out to an LLM or local NLP model.
   */
  async processTranscript(caseId: string, transcript: any[]): Promise<CaseFact[]> {
    const facts: CaseFact[] = [];
    const userTexts = transcript.filter(t => t.role === 'user').map(t => t.text).join(' ');

    // Basic regex-based extraction as a fallback / first-pass
    const timePatterns = /(\d{1,2}[:\s]?\d{0,2}\s*(बजे|am|pm|AM|PM)?)/g;
    const timeMatches = userTexts.match(timePatterns);
    if (timeMatches) {
      facts.push(this.createFact('time', timeMatches[0], 'transcript'));
    }

    const datePatterns = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
    const dateMatches = userTexts.match(datePatterns);
    if (dateMatches) {
      facts.push(this.createFact('date', dateMatches[0], 'transcript'));
    }

    const stationPattern = /(थाना|थाने|police\s*station)\s*([^\s,।]+)/gi;
    const stationMatch = stationPattern.exec(userTexts);
    if (stationMatch) {
      facts.push(this.createFact('station', stationMatch[2], 'transcript'));
    }

    // Persist facts
    if (typeof window !== 'undefined') {
      try {
        const db = getDB();
        const existingFacts = await db.caseFacts.where('caseId').equals(caseId).toArray();
        
        for (const fact of facts) {
          // Avoid duplicate facts
          const isDuplicate = existingFacts.some(
            (existing) => existing.label === fact.label && existing.value.toLowerCase().trim() === fact.value.toLowerCase().trim()
          );
          
          if (!isDuplicate) {
            await db.caseFacts.add({ ...fact, caseId });
          }
        }
      } catch (error) {
        console.error('Failed to persist facts to Dexie:', error);
      }
    }

    return facts;
  }

  /**
   * Retrieves all known facts for a case.
   */
  async getFactsForCase(caseId: string): Promise<CaseFact[]> {
    if (typeof window !== 'undefined') {
      try {
        const db = getDB();
        const facts = await db.caseFacts.where('caseId').equals(caseId).toArray();
        return facts.map(({ caseId: _, ...fact }) => fact);
      } catch (error) {
        console.error('Failed to retrieve facts from Dexie:', error);
        return [];
      }
    }
    return [];
  }

  private createFact(label: string, value: string, source: 'transcript' | 'ocr'): CaseFact {
    return {
      id: crypto.randomUUID(),
      label,
      value,
      source,
      confidence: 'medium', // Default to medium, can be upgraded by verification
      timestamp: Date.now()
    };
  }
}

export const memoryEngine = new CaseMemoryEngine();
