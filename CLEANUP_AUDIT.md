# Repository Cleanup Audit

## 1. Duplicate Components & Routes
* **Routes**: 
  * `src/app/case/[id]/page.tsx` (V3 experimental workspace using raw tailwind and placeholders)
  * `archive/app/(app)/case/[id]/page.tsx` (Original V2 production UI workspace)
* **Components**: 
  * `src/components/truthtrail/truthtrail/` (nested duplicate path, should be flattened to `src/components/truthtrail/`)
* **Adapters**: 
  * `src/adapters/legacy-case-adapter.ts` acts as a pass-through to `src/lib/legalJourney.ts`. While not strictly dead code, it is a migration shim.

## 2. Archive Dependencies
* The `archive/` folder contains old Python backend implementations (`archive/core/`, `archive/legal/`) and the original V2 React UI (`archive/app/`).
* The `.claude/` folder contains experimental worktrees (`worktrees/awesome-hertz-51fe1f`, `worktrees/blissful-grothendieck-c7b9e8`).
* **Analysis**: There are *no active imports* across the `src/` directory referencing `archive/`, `v2/`, or `.claude/`.

## 3. V3 Workspace vs Production UI
* The current `src/app/case/[id]/page.tsx` lacks the premium styling (`fr-card`, `bg-ivory`, etc.) of the original application.
* The original UI in `archive/app/(app)/case/[id]/page.tsx` contains the proper styling, responsive sidebar, language switcher, severity badge, and offline indicator, but it does not utilize the new V3 intelligence features (Missing Evidence, TruthTrail, Trust Score, Next Best Action).

## 4. Documentation Cleanup
* **Obsolete Files to Remove**: 
  * `BUILD_REPORT.md`
  * `BUILD_REPORT_V2.md`
  * `CLAUDE.md`
  * `CUTOVER_REPORT.md`
  * `DEMO_REPORT.md`
  * `FirstReport_BuildPrompts.docx`
  * `FirstReport_UI_ProjectPlan.docx`
  * `IMPORT_MIGRATION_REPORT.md`
  * `VERIFICATION_REPORT.md`
* **Keep**: `README.md`

## 5. Unused Files/Folders in Root
* `list_models.py`, `test_gemini.py`, `test_supabase.js`, `count-aliases.ts`, `test-demo.ts`, `smoke-test.ts`, `test-engines.ts`
* Python dependencies: `requirements.txt`, `venv/`
* Old DBs/output: `sessions.sqlite`, `output/`, `offline/`, `migrations/`, `documents/` (assuming they are not needed for active V3 Next.js app)

## 6. Action Plan
1. Delete `archive/`, `.claude/`, root obsolete docs, and root obsolete python/test scripts.
2. Merge the V3 intelligence capabilities from `src/app/case/[id]/page.tsx` into the V2 production UI code (`archive/app/(app)/case/[id]/page.tsx`).
3. Replace `src/app/case/[id]/page.tsx` with this newly merged file.
4. Flatten the nested `src/components/truthtrail/truthtrail/` directory.
5. Delete `src/adapters/` if possible or integrate properly.
6. Verify styling, routing, and validate production readiness.
