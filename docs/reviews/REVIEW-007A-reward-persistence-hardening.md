# REVIEW-007A — Reward Persistence Hardening

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-06
Scope: TASK-007A only (computeSessionXp removal, profile-missing throw, updateAchievement throw-on-miss)

---

## Fixes Applied

### F-001 — `rewardCalculator.test.ts`: missing test for wrong-move XP exclusion in `computeRewardSummary`

**File:** `src/services/__tests__/rewardCalculator.test.ts`

The removed `computeSessionXp` tests included "counts only accepted (correct) move entries in history" — the only direct test that verified `wrong` type entries in history do NOT count toward XP. The identical filter exists in `computeRewardSummary` (lines 115–117):

```ts
const correctMoves = result.history.filter(
  (f) => f.type === "accepted" && f.correct,
).length;
```

The surviving `computeRewardSummary` tests all use the default `makeResult()` which has 4 accepted+correct entries and zero wrong entries. If the filter regressed to just `f.type === "accepted"` (dropping the `.correct` check), no test would catch it.

Fix: added test "counts only accepted+correct history entries toward XP, not wrong-move entries" to the `computeRewardSummary` describe block, using a mixed history with 2 accepted+correct entries, 1 wrong entry, and 1 opponent entry.

### F-002 — `rewardService.ts`: dead `export type { RewardSummary }` re-export

**File:** `src/services/rewardService.ts`

`export type { RewardSummary } from "./rewardCalculator.ts"` at line 8 was a dead re-export. All callers import `RewardSummary` directly from `rewardCalculator.ts`:
- `processTrainingResult.ts`: `import type { RewardSummary } from "./rewardCalculator.ts"`
- `useTrainingSession.ts`: `import type { RewardSummary } from "../services/rewardCalculator.ts"`

No file imports from `rewardService.ts` as a source for `RewardSummary`. The re-export was also redundant given that line 3 already imports `type RewardSummary` for the function return annotation.

Fix: removed the dead re-export line.

### F-003 — `rewardsRepo.ts`: `updatePieceSkin` and `updateBoardTheme` inconsistent with `updateAchievement`

**File:** `src/lib/repositories/rewardsRepo.ts`

TASK-007A added a count check and throw to `updateAchievement` (matching the pattern from `updateUserProfile`). But `updatePieceSkin` and `updateBoardTheme` in the same file still silently no-oped on missing rows — three update functions in the same file with inconsistent contracts.

Fix: applied the same `const count = await db.*.update(id, updates); if (count === 0) throw new Error(...)` pattern to both functions. All three repo update functions now have consistent error behavior.

---

## Checklist Results

- `computeSessionXp` removed: ✓ (removed from rewardCalculator.ts; 5 tests removed; `computeRewardSummary` is canonical entry point)
- Missing user profile cannot silently drop XP/keys: ✓ (`if (!profile) throw new Error(...)` added in TASK-007A)
- Missing achievement row cannot silently no-op: ✓ (`updateAchievement` throws on count === 0 in TASK-007A)
- Reward persistence errors are clear: ✓ (errors propagate to `processTrainingResult` catch → `rewardError` field; error message preserved via `e instanceof Error ? e.message : "..."`)
- Reward persistence errors are test-covered: partially ✓ (pure computation is tested; `applyRewards` integration paths — missing profile throw, updateAchievement throw — have no test coverage. See C-001.)
- UI does not access Dexie directly: ✓
- Build passes: ✓
- Lint passes: ✓
- Tests pass: ✓ (130/130)
- HANDOFF.md updated: ✓ (TASK-007A entry present)

---

## Larger Concern

### C-001 — Partial persistence on `updateAchievement` throw: XP/keys committed, achievements not

**File:** `src/services/rewardService.ts`

The write sequence in `applyRewards`:
1. `updateUserProfile(...)` — commits XP/keys to profile ✓
2. `for (achId of ...) await updateAchievement(achId, ...)` — if any throw, exception propagates

If step 2 throws (e.g., seed data gap, corrupted DB row), control goes to `processTrainingResult`'s catch block. `rewardSummary` is never returned — stays `null`. But the XP/keys from step 1 ARE already in the DB.

Result: player's profile has the XP/keys (correctly persisted), but:
- `rewardSummary` is `null` → no reward card shown in UI
- `rewardError` is set → error banner shows "Achievement not found: ach_first_xxx"
- Achievement row not updated

In practice, this scenario is prevented by F-001 from REVIEW-007 (all achievement IDs now seeded). But the partial-persistence structure remains: profile write and achievement writes are not atomic. A future seed gap or DB inconsistency would trigger this.

**Recommended fix:** Options in order of increasing correctness:
- (a) Wrap achievement writes in a second try/catch and surface them as a non-fatal warning separate from the full reward error — this way XP is shown even if achievement fails.
- (b) Persist achievements before the profile XP write, so a throw leaves profile untouched (easier to retry).
- (c) Use a Dexie transaction covering both the profile write and achievement writes — atomically fail or succeed together.

Option (a) is the smallest change and matches the existing split between reward computation (pure) and persistence (best-effort). Option (c) is most correct but requires a broader refactor.

This concern exists regardless of whether the seed invariant holds — the write order creates a class of partial states that are invisible to the user (UI shows an error but XP was actually saved).
