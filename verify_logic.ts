import 'fake-indexeddb/auto';
import { memoryEngine } from './src/core/case-memory-engine';
import { intelligenceEngine } from './src/core/intelligence-engine';

// Mock localStorage for legalJourney
global.localStorage = {
  getItem: (key: string) => {
    if (key === 'fr_legal_journey') {
      return JSON.stringify([{
        id: "test-case-123",
        title: "Test Case",
        language: "en-IN",
        status: "active",
        personaId: "standard",
        severity: "normal",
        incidentSummary: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timeline: [],
        conversations: [
          {
            id: "conv-1",
            ts: Date.now(),
            personaId: "standard",
            language: "en-IN",
            summary: "",
            turns: []
          }
        ],
        documentsGenerated: [],
        evidence: [],
        reminders: [],
        pendingSteps: [],
        statutesCited: [],
        sessionIds: []
      }]);
    }
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 1,
  key: () => null
} as any;

// Mock window for Dexie condition
(global as any).window = global;

async function runTest() {
  const caseId = "test-case-123";

  console.log("=== Step 1: User says wallet was stolen at 2 PM ===");
  await memoryEngine.processTranscript(caseId, [{ role: 'user', text: "My wallet was stolen at 2 PM." }]);
  let facts = await memoryEngine.getFactsForCase(caseId);
  console.log("Facts extracted:");
  console.log(facts);

  let assessment = await intelligenceEngine.generateAssessment(caseId);
  console.log("\nAssessment 1:");
  console.log("Contradictions:", assessment.contradictions);
  console.log("Trust Score:", assessment.trustScore);
  console.log("Confidence Score:", assessment.confidenceScore);

  console.log("\n=== Step 2: User says wallet was stolen at 4 PM ===");
  await memoryEngine.processTranscript(caseId, [{ role: 'user', text: "My wallet was stolen at 4 PM." }]);
  facts = await memoryEngine.getFactsForCase(caseId);
  console.log("Facts extracted:");
  console.log(facts);

  assessment = await intelligenceEngine.generateAssessment(caseId);
  console.log("\nAssessment 2:");
  console.log("Contradictions:", assessment.contradictions);
  console.log("Trust Score:", assessment.trustScore);
  console.log("Confidence Score:", assessment.confidenceScore);
}

runTest().catch(console.error);
