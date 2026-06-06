# Memory Engine Remediation Report

## Problem Statement
The contradiction engine was disconnected from the truth evaluation loop because facts extracted from transcripts were never persisted. `CaseMemoryEngine.processTranscript` extracted facts but lacked a storage layer, and `CaseMemoryEngine.getFactsForCase` returned a hardcoded `[]`.

## Architecture Trace
* **Dexie (IndexedDB):** Used as the offline-first database for local storage, persisting structured entities like cases, messages, and documents.
* **localStorage:** Used for legacy state tracking (via `fr_legal_journey`).
* **Supabase:** Remote cloud sync target (via `syncEngine`).
* **Case Persistence:** The `FirstReportDB` class defined in `dexie.ts` acts as the primary data store for the user's local instance.

**Decision:**
Structured facts should live in Dexie (`FirstReportDB`) within a dedicated `caseFacts` table to maintain the offline-first architecture while providing proper structured querying capability for the `TruthEngine`.

## Implementation Details
### 1. `src/lib/db/dexie.ts`
* Added `LocalCaseFact` interface extending `CaseFact` with a `caseId`.
* Added `caseFacts!: EntityTable<LocalCaseFact, 'id'>;` to `FirstReportDB`.
* Incremented schema to `version(2)` specifying `'id, caseId, label, timestamp'` to ensure the table is created correctly.

### 2. `src/core/case-memory-engine.ts`
* **Persisting Facts:** Updated `processTranscript` to instantiate the Dexie DB instance and save newly extracted facts.
* **Deduplication:** Added logic to query `db.caseFacts` by `caseId` before insertion. A fact is only inserted if there isn't an existing fact with the exact same `label` and `value` (case-insensitive).
* **Retrieving Facts:** Updated `getFactsForCase` to query Dexie (`db.caseFacts.where('caseId').equals(caseId).toArray()`) and return the persisted array, discarding the `caseId` property to match the `CaseFact[]` contract.
* **Backward Compatibility & Error Handling:** Wrapped Dexie calls in `typeof window !== 'undefined'` to avoid breaking server-side rendering (SSR), and added `try/catch` blocks to gracefully fail and return empty sets if IndexedDB isn't available.

## Verification
A dedicated test script `verify_logic.ts` was written using `fake-indexeddb` to run the business logic directly without UI flakiness.

The execution proved that:
1. Extracting "2 PM" successfully persisted the fact and yielded no contradictions.
2. Extracting "4 PM" successfully persisted the new fact without deduplication blocking it (since value differs).
3. The TruthEngine successfully detected the contradiction `2 pm vs 4 pm`.
4. The Trust Score correctly penalized the score from `90` to `70`.
