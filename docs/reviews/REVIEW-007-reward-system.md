# REVIEW-007 — Reward System

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-06
Scope: TASK-007 only (rewardCalculator, rewardService, processTrainingResult wiring, useTrainingSession/Practice.tsx reward display)

---

## Fixes Applied

### F-001 — `defaults.ts`: `ach_first_perfect_run` and `ach_first_mastered` missing from DEFAULT_ACHIEVEMENTS

**File:** `src/lib/seed/defaults.ts`

`rewardCalculator.ts` references four achievement IDs: `ach_first_lesson`, `ach_first_perfect_run`, `ach_first_mastered`, `ach_perfect_10`. The seed data in `DEFAULT_ACHIEVEMENTS` only contained two of those: `ach_first_lesson` and `ach_perfect_10`. The other two (`ach_first_perfect_run`, `ach_first_mastered`) were absent.

Consequence: `updateAchievement(achId, { unlockedAt: now })` calls `db.achievements.update(achId, ...)`. Dexie's `Table.update()` returns 0 for missing rows **without throwing**. The try/catch in `rewardService.ts` catches thrown errors but not silent no-ops — so the failure is invisible. Since the achievement row is never written, `getUnlockedAchievements()` never returns these IDs, so `alreadyUnlockedIds` never includes them. On every subsequent session that meets the threshold, `computeAchievementTransitions` returns the achievement as newly unlocked again. The player would see "New Achievement!" on every qualifying session indefinitely.

Fix: Added `ach_first_perfect_run` ("Perfect Form") and `ach_first_mastered` ("Mastered") to `DEFAULT_ACHIEVEMENTS`. The seed function (`seedCoreData`) is idempotent — it only adds missing IDs — so existing installations pick up the new rows on next launch.

### F-002 — `rewardService.ts`: duplicate imports from same module

**File:** `src/services/rewardService.ts`

```ts
import { computeRewardSummary } from "./rewardCalculator.ts";
import type { RewardSummary } from "./rewardCalculator.ts";
```

Two separate `import` statements from the same module. `TECHNICAL_STANDARDS.md` requires imports from the same module to be merged.

Fix: merged into `import { computeRewardSummary, type RewardSummary } from "./rewardCalculator.ts"`.

### F-003 — `rewardService.ts`: `getAllAchievements()` + in-memory filter instead of `getUnlockedAchievements()`

**File:** `src/services/rewardService.ts`

```ts
const allAchievements = await getAllAchievements();
const alreadyUnlockedIds = new Set(
  allAchievements.filter((a) => a.unlockedAt !== undefined).map((a) => a.id),
);
```

`rewardsRepo.ts` already exports `getUnlockedAchievements()` which performs this filter at the DB level. Using `getAllAchievements()` + JS filter fetches the full table then discards records — wasted I/O and allocation.

Fix: changed to `getUnlockedAchievements()` and removed the `.filter()`.

---

## Checklist Results

- XP awards match PROGRESSION_SYSTEM.md: ✓ (+1/move, +25 perfect run, +100 mastery, +50 review, +250 boss, +500 world — constants match)
- Keys awards match PROGRESSION_SYSTEM.md: ✓ (+1 mastery, +3 boss, +5 world)
- Achievements unlock only once: ✓ (after F-001, all 4 achievement IDs are seeded; `alreadyUnlockedIds` gate prevents re-award)
- Cosmetic inventory persists: ✓ (`updatePieceSkin`, `updateBoardTheme` added to rewardsRepo; cosmetic unlock rules deferred — documented in HANDOFF known issues)
- Mastery reward is not double-awarded: ✓ (`wasJustMastered = oldProgress.masteryLevel < 4 && newProgress.masteryLevel >= 4`)
- Practice completion reward summary is correct: ✓ (rewardSummary returned in ProcessResult, displayed in Practice.tsx result card)
- Storage failures are not silently swallowed: partially ✓ (reward errors surfaced via rewardError banner; progress persistence errors still silently swallowed — pre-existing REVIEW-006A C-001)
- UI does not access Dexie directly: ✓ (all DB access via repositories)
- Reward logic is not embedded in React components: ✓ (computeRewardSummary/applyRewards in services layer; Practice.tsx is display-only)
- Tests cover the reward rules: ✓ (17 tests in rewardCalculator.test.ts)
- Build passes: ✓
- Lint passes: ✓
- Tests pass: ✓ (134/134)
- HANDOFF.md updated: ✓ (TASK-007 entry present)
- PROJECT_STATE.md updated: ✓ (status updated to "TASK-007 Complete")

---

## Larger Concerns

### C-001 — `computeSessionXp` is dead code with a misleading public API

**File:** `src/services/rewardCalculator.ts`

`computeSessionXp(result, wasMastered)` is exported but never called from production code. Only `computeRewardSummary` is called (from `applyRewards`). The function's `wasMastered` parameter is entirely unused — lines 117–122 are an empty if block with only comments:

```ts
if (result.completed && result.perfectRun && !wasMastered) {
  // Check if this run would trigger mastery (10th perfect run)
  // ...
}
// The mastery bonus is handled separately in computeRewardSummary
```

The problem isn't just dead code — it's a broken public API. A future caller who uses `computeSessionXp(result, false)` expecting the complete session XP will get wrong results: they'll compute `+1/move + +25 perfect run` but miss the `+100 mastery bonus`. `computeRewardSummary` handles mastery bonus internally using `oldProgress`/`newProgress` comparison, so the caller would need to use that instead.

**Recommended fix:** Remove `computeSessionXp` and its test suite, or rename it `computeBaseXp` (no mastery bonus) and document explicitly that it is partial.

### C-002 — XP/keys are silently dropped when the user profile doesn't exist

**File:** `src/services/rewardService.ts`

```ts
if (summary.xp > 0 || summary.keys > 0) {
  const profile = await getUserProfile(DEFAULT_USER_ID);
  if (profile) {
    await updateUserProfile(DEFAULT_USER_ID, { totalXp: ..., keys: ... });
  }
}
```

`getUserProfile` returns `undefined` for a missing profile (not `null` — Dexie returns `undefined`). If the profile is absent, the `if (profile)` guard silently skips the write. `applyRewards` still returns the full `summary` with non-zero xp/keys. The UI shows "+100 XP" and "+1 Key" but neither was persisted.

This is realizable on first launch if `seedCoreData` races with the first session completion (unlikely but real on a loaded device), or if the default profile row was deleted by a schema upgrade or DB reset.

The pre-existing guard in `updateUserProfile` does throw on missing profile (`if (count === 0) throw new Error(...)`) — but `applyRewards` never reaches that call when profile is `undefined`.

**Recommended fix:** Replace the silent skip with an assertion or explicit error: `if (!profile) throw new Error("User profile not found — seed data may not have run")`. This surfaces the root cause instead of silently losing rewards.

### C-003 — `updateAchievement` uses `update()` not `put()` — relies on seed invariant, no error on miss

**File:** `src/lib/repositories/rewardsRepo.ts`

`db.achievements.update(id, updates)` is a no-op if the row is missing (returns 0, does not throw). The catch block in `rewardService.ts` catches thrown errors, not silent 0-returns. This means: if an achievement exists in `rewardCalculator.ts` but is not in `defaults.ts`, it silently never persists. F-001 fixes the immediate gap (adds the two missing rows), but the repo function itself has no failure signal for a caller who passes an unknown ID.

**Recommended fix:** Either (a) change `updateAchievement` to check the return value and throw if 0 — matching the pattern in `updateUserProfile` — or (b) use `put()` with upsert semantics so new achievement IDs can be persisted even if not pre-seeded. Option (a) is safer (catches future seed gaps early); option (b) is more resilient to seed inconsistencies.

### C-004 — Asymmetric error handling: progress persistence errors still silently swallowed

**File:** `src/services/processTrainingResult.ts`

`upsertLessonProgress(updated)` at line 32 has no try/catch. If that IndexedDB write fails (quota exceeded, schema error), the error propagates up to `processTrainingResult`, which bubbles up to `useTrainingSession`'s `.catch(() => { setRewardError("Failed to save progress.") })` — a reward error banner is shown, which is confusing messaging for a progression failure.

TASK-007 partially addressed REVIEW-006A C-001 by surfacing reward errors via `rewardError`. But progress persistence errors are still swallowed or misattributed. On a Raspberry Pi tablet under storage pressure, a `QuotaExceededError` on `upsertLessonProgress` would show "Failed to save progress." — but framed as a reward error, not a progression error.

This is pre-existing, documented in REVIEW-006A C-001, and tracked in HANDOFF known issues. Noted here for completeness.
