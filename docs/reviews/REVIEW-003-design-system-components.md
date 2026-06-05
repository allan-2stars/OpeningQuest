# REVIEW-003 - Design System Components

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-05
Task: TASK-003-design-system-components.md
Commit reviewed: d29fad6

---

## Summary

TASK-003 is functionally complete. All 12 required components exist, are pure presentational, contain no business logic, and do not access Dexie directly. Design tokens are expanded. A design-system demo page at `/design-system` exercises all components. Build, lint, and tests all passed (46/46 before review).

Five confirmed bugs were fixed during this review. Three larger concerns are documented below.

---

## Applied Fixes

### FIX-001: Modal overlay click never called onClose (CRITICAL)

**File:** `src/components/Modal.tsx`

**Bug:** The overlay click guard was `if (e.target === overlayRef.current) onClose()`. When a user clicks the visible black backdrop (`<div class="absolute inset-0 bg-black/60">`), `e.target` is that inner sibling div — not `overlayRef.current` (the outer flex container). The check always evaluated false, so backdrop click never closed the modal.

**Fix:** Moved `onClick={onClose}` directly to the black backdrop div, removing the broken `overlayRef` check from the outer div entirely.

**Also fixed in same file:** `aria-label={title}` on the `role="dialog"` element produced an omitted attribute when `title` was undefined, leaving the dialog with no accessible name (ARIA spec violation). Changed to `aria-labelledby="modal-title"` with a corresponding `id="modal-title"` on the `<h2>` element. The `aria-labelledby` attribute is only set when `title` is present, so titleless modals are still documented as a concern (see C-002).

### FIX-002: FeedbackBanner visible state not reset on message change

**File:** `src/components/FeedbackBanner.tsx`

**Bug:** `visible` was initialized to `true` via `useState(true)` with no mechanism to reset it when `message` or `type` props changed. After a user dismissed a banner (`visible = false`), a parent updating the `message` prop to show a new error/success would produce no visible output — the banner silently returned `null` for all subsequent messages.

**Fix:** Replaced `useState(true)` + `setVisible` with a `dismissedKey` string state. The component derives `visible = dismissedKey !== \`\${type}:\${message}\``. Dismissing stores the current message key; changing `message` or `type` immediately makes `visible` true again without needing an effect. This also avoids the `react-hooks/set-state-in-effect` lint rule.

**Also fixed in same file:** `!autoDismissMs` treated `autoDismissMs={0}` as "no timer" — changed to `autoDismissMs == null`. The auto-dismiss effect now depends on `messageKey` (not `onDismiss`), eliminating the timer-reset-on-inline-function bug. `onDismiss` is captured via `useRef` so it's always fresh without being a dep.

**Test added:** "reappears when message changes after being dismissed"

### FIX-003: LessonNode rendered `<div disabled>` for locked nodes — invalid HTML

**File:** `src/components/LessonNode.tsx`

**Bug:** `const Tag = isInteractive ? "button" : "div"` then `<Tag disabled={!isInteractive}>` rendered `<div disabled="true">` for locked nodes. The `disabled` attribute is not valid on `<div>` elements — browsers ignore it. The node had no semantic inactivity signal for AT. TypeScript allowed it because the union type `"button" | "div"` includes `button`'s props, but the DOM output was malformed.

**Fix:** Always render `<button>`. Locked nodes get `disabled` (semantically correct on button), `cursor-not-allowed` CSS, and `onClick={undefined}`. Unlocked nodes get normal interaction.

**Test updated:** "is not interactive when locked" → "is disabled when locked" — now checks `button.disabled === true` instead of expecting no button element.

### FIX-004: ProgressBar division by zero when max=0 produced NaN%

**File:** `src/components/ProgressBar.tsx`

**Bug:** `pct = Math.min(100, Math.max(0, (value / max) * 100))` — when `max === 0`, this is `0/0 = NaN`. `Math.max(0, NaN)` and `Math.min(100, NaN)` both return `NaN`. The fill div got `style={{ width: "NaN%" }}` — rendered as zero width with no error, indistinguishable from a 0% legitimate state. `WorldCard` passes `totalLessons` as `max` with no guard.

**Fix:** Added `max === 0 ? 0 :` guard before the formula.

### FIX-005: HANDOFF.md commit hash left as "N/A (pending)"

**File:** `docs/HANDOFF.md`

**Fix:** Updated TASK-003 commit hash from `N/A (pending)` to `d29fad6`. Same issue caught and fixed in REVIEW-002 — repeating a known pattern.

---

## Larger Concerns (Not Fixed — Notes Only)

### C-001: `/design-system` route and nav link are in the production bundle with no DEV guard

`App.tsx` and `AppShell.tsx` add the `/design-system` route and "DS" nav item unconditionally. `vite build` includes the `DesignSystem` component (197 lines of demo content) in the production bundle. Any user — including the target 8–14 audience — can navigate to it.

HANDOFF.md acknowledges this as "dev-only — remove before launch" but the code provides no enforcement.

Recommended fix at the start of TASK-004 or as a dedicated cleanup:

```tsx
// App.tsx
{import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}

// AppShell.tsx
...(import.meta.env.DEV ? [{ to: "/design-system", label: "DS" }] : []),
```

Vite replaces `import.meta.env.DEV` at build time and tree-shakes the dead branch.

### C-002: Modal has no accessible name and no close button when title is omitted

When `<Modal>` is used without a `title` prop:
- `aria-labelledby` is not set (no h2 exists)
- No close button is rendered
- Only Escape key and backdrop click can dismiss

`title` is typed as optional, so this is a valid usage that produces an ARIA violation (WCAG 2.1 criterion 4.1.2). The fix from FIX-001 (`aria-labelledby`) only applies when `title` is present.

Recommended: add a required `aria-label` fallback prop for titleless modals, or make `title` required.

### C-003: Feature placeholder pages still use hand-rolled empty-state markup, not the new EmptyState component

Six feature pages (Adventure, Classic, Practice, Collection, Profile, Settings) each contain identical hand-written placeholder divs (`border-dashed border-slate-600 p-12 text-slate-500`). The `EmptyState` component was built to replace exactly this pattern but none of the existing placeholders were migrated.

This is low urgency for the current V1 phase — the feature pages are stubs — but when each feature is implemented, the implementing agent should use `EmptyState` rather than re-inventing the placeholder.

---

## Verification Results

| Check | Result |
|-------|--------|
| All 12 required components created | PASS |
| Components match UI_DESIGN.md style | PASS |
| Tablet-first sizing | PASS |
| Accessibility focus states | PASS |
| No business logic in components | PASS |
| No Dexie access in components | PASS |
| `tsc -b` | PASS |
| `eslint .` | PASS |
| `vitest run` | 47/47 PASS (was 46/46) |
| `vite build` | PASS |
| HANDOFF.md updated | YES (after fix) |
| PROJECT_STATE.md updated | YES |

---

## Recommendation

TASK-003 is complete with fixes applied. Safe to proceed to TASK-004. Address C-001 (DEV guard for /design-system) early in TASK-004 or as a fast standalone commit before TASK-004 goes far.
