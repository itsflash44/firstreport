import type { CaseFact, IntelligenceOutput } from '../types';
import { getLegalCase as getCase, updateCase } from '../lib/legalJourney';

/**
 * Recommendation Engine
 * Analyzes current case state to determine missing evidence and the Next Best Action.
 */
export class RecommendationEngine {
  
  /**
   * Generates the Missing Evidence and Next Best Action based on the case classification and current state.
   */
  generateRecommendations(caseId: string, facts: CaseFact[]): {
    nextBestAction: IntelligenceOutput['nextBestAction'];
    missingEvidence: IntelligenceOutput['missingEvidence'];
  } {
    const legacyCase = getCase(caseId);
    
    const missingEvidence: IntelligenceOutput['missingEvidence'] = [];
    
    // Example logic based on classification
    if (legacyCase?.bnssSection === '303') { // Example: Theft
      missingEvidence.push({
        type: 'ownership_proof',
        reason: 'Needed to prove ownership of the stolen item.',
        critical: true
      });
    }

    // Determine Next Best Action
    let nextBestAction: IntelligenceOutput['nextBestAction'] = {
      type: 'answer_question',
      label: 'Complete Incident Details',
      priority: 'high'
    };

    if (missingEvidence.length > 0) {
      nextBestAction = {
        type: 'upload_doc',
        label: `Upload ${missingEvidence[0].type.replace('_', ' ')}`,
        priority: 'high'
      };
    } else if (legacyCase?.documentsGenerated && legacyCase.documentsGenerated.length > 0) {
       nextBestAction = {
        type: 'file_complaint',
        label: 'File generated complaint',
        priority: 'high'
      };
    }

    return {
      nextBestAction,
      missingEvidence
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
