# REVIEW-001 - Project Bootstrap

Reviewer: Secondary Pi Agent
Date: 2026-06-04
Task: TASK-001-project-bootstrap.md
Commit: 24166b0

---

## Summary

TASK-001 implementation is functionally complete. Build passes, lint passes, Docker Compose maps 4317:5173 correctly, Vite listens on 0.0.0.0, all 8 placeholder routes exist, TailwindCSS v4 design tokens are in place.

Small fixes were applied by this review pass (see Applied Fixes below).

---

## Applied Fixes

### 1. Missing required folder structure

TASK-001 specifies 10 folders under `src/`. Only 3 were created. Added .gitkeep files in the missing 7:

- `src/hooks/`
- `src/lib/`
- `src/repositories/`
- `src/services/`
- `src/stores/`
- `src/types/`
- `src/assets/`

### 2. Placeholder PWA icons missing

`vite.config.ts` references `/icon-192.png` and `/icon-512.png` in the PWA manifest, but neither existed in `public/`. The service worker workbox precache would 404 on these during a production build, causing SW install failure.

Created minimal placeholder PNGs (solid royal-blue `#1e3a5f`). Replace with real branded icons before launch.

### 3. Docker HMR broken on host browser

Vite's HMR websocket URL defaults to the server's internal port (5173). A browser connecting via the Docker-mapped host port (4317) tries `ws://localhost:5173`, which is not exposed. HMR updates silently fail.

Added to `vite.config.ts` server block:
```ts
hmr: { clientPort: 4317 }
```

### 4. File watcher doesn't trigger inside Docker on Linux

Docker bind mounts on Linux do not propagate inotify events into the container. Vite's chokidar watcher never sees file changes, so the dev server doesn't rebuild on save.

Added to `vite.config.ts` server block:
```ts
watch: { usePolling: true }
```
Added to `docker-compose.yml` environment:
```
CHOKIDAR_USEPOLLING=true
```

### 5. HANDOFF.md commit hash left as "N/A (pending)"

Updated to `24166b0`.

### 6. PROJECT_STATE.md Next Task pointed to TASK-001 (current task)

Changed from `TASK-001-project-bootstrap.md` to `TASK-002-core-data-layer.md`.

### 7. PWA orientation locked to "landscape"

The product is tablet-first. Tablets are often held portrait. Locking to `landscape` would force-rotate or block PWA install on portrait tablets.

Changed `orientation` from `"landscape"` to `"any"`.

---

## Larger Concerns (Not Fixed — Notes Only)

### C-001: tsconfig.json does not use project references

The standard Vite scaffold pattern uses `tsconfig.json` as a pure references hub:
```json
{ "files": [], "references": [{"path": "./tsconfig.app.json"}, {"path": "./tsconfig.node.json"}] }
```

The current `tsconfig.json` has `include: ["src"]` and full `compilerOptions`, bypassing the composite build system. `tsconfig.app.json` and `tsconfig.node.json` exist with `composite: true` but are never referenced — their settings are ignored. This means:
- `vite.config.ts` and `eslint.config.ts` are type-checked with browser DOM types, not pure Node types
- Incremental build caching via `.tsbuildinfo` is inactive

Build still passes because the root tsconfig is valid. Low urgency — fix when other tooling needs proper project separation. Recommend aligning with Vite scaffold convention in TASK-002.

### C-002: ARCHITECTURE.md and TECHNICAL_STANDARDS.md not created

TASK-001 required reading includes these files. They don't exist. The HANDOFF notes this but marks Known Issues as "None." Future agents will get file-not-found errors when following the required reading checklist.

Recommend creating stub versions as part of TASK-002 handoff.

### C-003: docker-compose.yml anonymous volume caveat

The `node_modules` anonymous volume is only populated from the image on first container creation. After `docker compose up` (without `down -v`), a subsequent package.json change + `docker compose up --build` will rebuild the image with new dependencies, but the old anonymous volume will shadow the fresh `node_modules`. Running `docker compose down -v` before `up --build` is required to pick up new dependencies.

This is a known Docker dev workflow footgun. Add a note in the project README when it's created.

---

## Verification Results

| Check | Result |
|-------|--------|
| `tsc -b` | PASS |
| `eslint .` | PASS |
| `docker compose` available | YES (v5.1.0) |
| Port mapping 4317:5173 | CORRECT |
| Vite host 0.0.0.0 | CORRECT |
| Vite port 5173 | CORRECT |
| All 8 placeholder routes | PRESENT |
| TailwindCSS v4 @theme tokens | PRESENT |
| PWA plugin configured | YES |
| HANDOFF.md updated | YES (after fix) |
| PROJECT_STATE.md updated | YES (after fix) |

---

## Recommendation

TASK-001 is complete with fixes applied. Safe to proceed to TASK-002.
