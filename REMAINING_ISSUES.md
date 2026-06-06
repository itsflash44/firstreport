# FirstReport Remaining Issues

## 1. Missing Production API Keys
The application gracefully falls back to offline modes when services are unreachable, but the primary integrations require API keys for full capability:
- **Supabase PostgreSQL**: Currently missing or incorrectly configured `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Prisma attempts to connect to `postgres.lrjsehyaownymovryeru`, leading to `ENOTFOUND`.
- **Google Generative AI (Gemini/Gemma)**:
  - The model `gemma-3-4b-it` is returning a `404 Not Found` for API version `v1beta`.
  - The model `gemini-2.0-flash` is returning `429 Too Many Requests` (Quota Exceeded).

## 2. Hardcoded English Fallbacks
While localized interfaces work perfectly for Hindi and English, some `STATUS_BADGE` internal values (`active`, `pending`) fallback to hardcoded english UI keys when bypassing the primary context handlers in specific offline workflows.

## 3. Playwright Concurrency
Currently Playwright runs the test flow as one large serial session block (`End to End Journey`) to maintain `localStorage`. Long-term E2E architecture should utilize Playwright's `test.use({ storageState: 'state.json' })` capabilities to parallelize individual tests without dropping offline case contexts.
