# REVIEW-009 — PGN Import/Export

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-08
Task reviewed: TASK-009 (PGN import/export and JSON backup/restore)

---

## Summary

TASK-009 implements PGN import/export, JSON backup/export, and JSON backup/restore via a new
ImportExport feature with three tabs (Import PGN, Export PGN, Backup). Five bugs were fixed inline.
Three larger concerns are documented below.

---

## Fixed Inline

### F-001 — Critical: `loadLines()` called in render body (race condition)

**File:** `src/features/import-export/ImportExport.tsx`

**Problem:** The original code called `loadLines()` directly in the render body:
```tsx
if (!loadedLines) {
  loadLines();
}
```
`loadLines` is an async function that calls `setImportedLines`. Any parent re-render while the
async fetch is in-flight would re-evaluate this guard (loadedLines is still false until the async
completes), triggering multiple concurrent `getImportedLines()` DB calls. The last one to resolve
wins, potentially overwriting fresher data with a stale result.

**Fix:** Replaced with a cancellable `useEffect` fetch that runs once on mount:
```tsx
useEffect(() => {
  let cancelled = false;
  getImportedLines()
    .then((lines) => { if (!cancelled) setImportedLines(lines); })
    .catch(() => {});
  return () => { cancelled = true; };
}, []);
```
The `loadLines` helper is kept for post-import refresh from `handleImport`. The `loadedLines`
state variable (previously used to guard the render-body call) was removed.

---

### F-002 — Minor: `depth` formula wrong for imported lessons

**File:** `src/lib/repositories/customOpeningRepo.ts`

**Problem:** `addImportedOpening` set `depth: line.sanMoves.length` (total moves). The correct
formula is: White = `ceil(N/2)`, Black = `floor(N/2)` — same as the curriculum lesson data. A
7-move White opening would get depth 7 instead of 4. `depth` is UI-only (displayed as "Depth N"
in `LessonNode.tsx`), but the wrong value is misleading and would break any future use of `depth`
for difficulty tuning.

**Fix:**
```ts
depth: side === "white"
  ? Math.ceil(line.sanMoves.length / 2)
  : Math.floor(line.sanMoves.length / 2),
```

---

### F-003 — Plausible: `addImportedOpening` missing Dexie transaction

**File:** `src/lib/repositories/customOpeningRepo.ts`

**Problem:** Four sequential `put()` calls ran without a transaction:
```ts
await putOpeningLine(line);
await putOpeningFamily(family);
await putVariation(variation);
await putLesson(lesson);
```
If `putLesson` failed (e.g., storage quota exceeded after the first three writes), the DB would
contain an orphaned OpeningLine, OpeningFamily, and Variation with no corresponding Lesson.
`getImportedLines()` would surface the orphaned line; navigating to practice it would fail
(no lesson record).

`seedCurriculum.ts` already wraps similar multi-table operations in a `db.transaction()`.

**Fix:** Wrapped all four puts in `db.transaction("rw", [db.openingLines, db.openingFamilies, db.variations, db.lessons], ...)` for all-or-nothing atomicity.

---

### F-004 — Cleanup: Duplicate `pgnService` imports

**File:** `src/features/import-export/ImportExport.tsx`

Two separate import lines for the same module:
```ts
import { parsePgn } from "../../services/pgnService.ts";
import { exportPgn } from "../../services/pgnService.ts";
```
Consolidated to one: `import { parsePgn, exportPgn } from "../../services/pgnService.ts";`
Similarly consolidated `type { Side }` and `type { OpeningLine }` from the same domain module.

---

### F-005 — Confirmed: `importBackup` has no transaction; partial restore leaves DB corrupted

**File:** `src/services/backupService.ts`

**Problem:** `importBackup` first clears all tables with `Promise.all(db.tables.map(t => t.clear()))`,
then restores via sequential `bulkPut` calls — none of which are wrapped in a transaction.
If a `bulkPut` fails on table N (storage quota, constraint, or any other Dexie error), all tables
up to N are cleared and restored, while tables N+ remain empty. The function returns `{ ok: false }`
but the DB is in a partially wiped state — data loss with no rollback.

**Fix:** Wrapped the entire clear + restore sequence in a single `db.transaction("rw", db.tables, ...)`.
If any step fails, Dexie automatically rolls back the entire transaction, leaving the original
data intact.

---

## Larger Concerns (not fixed — documented for future tasks)

### C-001 — importBackup clears future schema tables (forward incompatibility)

**File:** `src/services/backupService.ts`

`importBackup` uses `db.tables.map(t => t.clear())` to clear **all** tables. If TASK-010 or later
adds a new table (e.g., `collections`), importing a TASK-009 backup will clear the `collections`
table but never restore it (the backup JSON has no `collections` field). The user loses all
collection data silently.

**Recommendation:** When adding new tables in future tasks, add the corresponding field to
`BackupData`, `exportBackup`, and the `collections` array in `importBackup`. Keep `isValidBackupShape`
in sync. Consider adding a migration path comment whenever `BACKUP_VERSION` is bumped.

### C-002 — `isValidBackupShape` validates only 4 of 14 fields

**File:** `src/services/backupService.ts`

`isValidBackupShape` checks `version`, `lessonProgress`, `achievements`, `worlds`, and `openingLines`
but does not validate `pieceSkins`, `boardThemes`, `variations`, `lessons`, `trainingSessions`,
`dailyQuests`, `userProfile`, or `exportedAt`. A backup JSON with corrupt/missing arrays for those
fields passes validation and proceeds to `bulkPut`, which may throw or silently restore garbage data.

The current validation is sufficient for the happy path (self-generated backups). The risk is
a user editing their backup JSON or using a truncated file. Acceptable for V1 but worth noting.

### C-003 — Imported lessons have no `LessonProgress` row

**File:** `src/lib/repositories/customOpeningRepo.ts`

`addImportedOpening` creates Lesson, Variation, OpeningFamily, and OpeningLine records but does
not create a `LessonProgress` row. When the user navigates to practice the lesson,
`processTrainingResult` falls back to `makeStubProgress` (masteryLevel: 0, status: "available").
This is functional but inconsistent:
- The lesson won't appear in `getAllLessonProgress()` — it's invisible to the review system
- Streak and XP accounting could differ from seeded lessons

For V1 (custom openings outside the adventure map), this is acceptable. For TASK-010 (collection
system that may track custom opening progress), a `LessonProgress` row should be created on import.

---

## Checklist

- [x] Valid PGN imports correctly (chess.js loadPgn + SAN replay validation)
- [x] Invalid PGN errors are clear (empty, no moves, illegal move messages)
- [x] Imported PGN creates sanMoves and fenPositions (tested in pgnBackup.test.ts)
- [x] Imported lines replay through chess.js (test: "replays the parsed line without errors")
- [x] Exported PGN can be re-imported (test: "produces valid PGN text that can be re-imported")
- [x] JSON backup includes all required local app state (all 12 tables + version + timestamp)
- [x] JSON restore validates backup shape (isValidBackupShape; version range check)
- [x] Restore behavior is explicit: full replace, warning shown in UI
- [x] Custom openings stored through repositories (customOpeningRepo, no direct Dexie in UI)
- [x] UI does not access Dexie directly (ImportExport.tsx → services + repo layer only)
- [x] Build passes (tsc --noEmit clean)
- [x] Lint passes (eslint 0 errors)
- [x] Tests pass (197/197)
- [x] HANDOFF updated
