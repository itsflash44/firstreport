import type { IntelligenceOutput } from '../types';
import { getLegalCase as getCase, updateCase } from '../lib/legalJourney';
import { memoryEngine } from './case-memory-engine';
import { recommendationEngine } from './recommendation-engine';
import { truthEngine } from './truth-engine';
import { confidenceEngine } from './confidence-engine';

/**
 * Intelligence Engine
 * The central nervous system of V3. Aggregates data from all sub-engines 
 * to produce a single, immutable assessment of the case.
 */
export class IntelligenceEngine {

  /**
   * Generates the comprehensive IntelligenceOutput for a given case.
   */
  async generateAssessment(caseId: string): Promise<IntelligenceOutput> {
    const legacyCase = getCase(caseId);
    
    // Retrieve facts from Memory Engine
    const facts = await memoryEngine.getFactsForCase(caseId);
    
    // Retrieve contradictions from Truth Engine
    const contradictions = await truthEngine.evaluateContradictions(caseId, facts); 
    
    // Calculate Trust Score (0-100)
    // Base 100, minus penalties for missing critical info or contradictions
    let trustScore = 100;
    if (contradictions.length > 0) trustScore -= 20;
    if (facts.length < 3) trustScore -= 10;

    // Calculate Readiness Score (0-100)
    let readinessScore = 10; // Base starting point
    if (legacyCase?.documentsGenerated && legacyCase.documentsGenerated.length > 0) {
      readinessScore = 100;
    } else if (facts.length > 3) {
      readinessScore = 50;
    }

    // Get Recommendations
    const { nextBestAction, missingEvidence } = recommendationEngine.generateRecommendations(caseId, facts);

    // Determine Risk Assessment
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const factors: string[] = [];
    if (legacyCase?.severity === 'critical') {
      riskLevel = 'critical';
      factors.push('High severity incident reported');
    }

    // Evaluate Confidence Engine
    const turnCount = legacyCase?.conversations?.length || 0;
    const confidenceResult = confidenceEngine.canConcludeIntake(facts, turnCount, contradictions);
    
    return {
      trustScore: Math.max(0, trustScore),
      readinessScore,
      confidenceScore: confidenceResult.confidenceScore,
      intakeComplete: confidenceResult.canConclude,
      nextBestAction,
      missingEvidence,
      contradictions,
      riskAssessment: {
        level: riskLevel,
        factors
      }
    };
  }
}

export const intelligenceEngine = new IntelligenceEngine();
