# TASK-001 - Project Bootstrap

Status:

Ready

Priority:

P0

Assigned Agent:

Windows Agent

---

# Goal

Create the initial Opening Quest application shell.

The project must run through Docker Compose.

No gameplay logic.

No training engine.

No progression system.

Focus only on project foundation.

---

# Required Reading

Before implementation read:

* CLAUDE.md
* docs/PROJECT_STATE.md
* docs/DECISIONS.md
* docs/PRD.md
* docs/ARCHITECTURE.md
* docs/TECHNICAL_STANDARDS.md
* docs/UI_DESIGN.md
* docs/AI_WORKFLOW.md

---

# Required Stack

* React
* Vite
* TypeScript
* TailwindCSS
* Zustand
* chess.js
* react-chessboard
* Dexie
* vite-plugin-pwa
* Docker
* Docker Compose

---

# Required Folder Structure

```text
src/
  app/
  components/
  features/
  hooks/
  lib/
  repositories/
  services/
  stores/
  types/
  assets/
```

---

# Required Pages

Create placeholder routes/pages:

* Home
* Adventure
* Classic
* Practice
* Collection
* Profile
* Settings
* ImportExport

---

# Docker Requirements

Create:

```text
Dockerfile
docker-compose.yml
.dockerignore
```

---

# Docker Compose Requirements

Service name:

```text
opening-quest-web
```

Container app port:

```text
5173
```

Host port:

```text
4317
```

Required mapping:

```yaml
ports:
  - "4317:5173"
```

The app must be accessible at:

```text
http://localhost:4317
```

---

# Vite Docker Requirement

Vite must listen on:

```text
0.0.0.0
```

so it works inside Docker.

Expected dev command should support:

```bash
npm run dev -- --host 0.0.0.0
```

or equivalent package script.

---

# Required Scripts

Add scripts:

```json
{
  "dev": "vite --host 0.0.0.0",
  "build": "tsc -b && vite build",
  "preview": "vite preview --host 0.0.0.0",
  "lint": "eslint .",
  "test": "vitest"
}
```

Adjust only if project tooling requires it.

---

# Requirements

## 1

Initialize Vite React TypeScript app.

---

## 2

Configure TailwindCSS.

---

## 3

Configure ESLint.

---

## 4

Configure Prettier.

---

## 5

Configure PWA.

---

## 6

Install core dependencies.

---

## 7

Create placeholder routes/pages.

---

## 8

Create app shell layout.

---

## 9

Create basic design token file.

---

## 10

Create Docker Compose development setup.

---

# Explicitly Out Of Scope

Do NOT implement:

* Training engine
* Mastery system
* Rewards
* XP
* Keys
* Lessons
* Maps
* Opening curriculum
* Import/export
* Storage logic
* Stockfish
* AI features
* Any backend

---

# Acceptance Criteria

Project builds successfully.

Project runs through Docker Compose.

The command below works:

```bash
docker compose up --build
```

App loads at:

```text
http://localhost:4317
```

Tailwind works.

PWA plugin configured.

Routes exist.

Placeholder pages render.

No TypeScript errors.

No ESLint errors.

---

# Manual Test

Run:

```bash
docker compose up --build
```

Verify:

```text
http://localhost:4317
```

loads.

Verify all placeholder pages are reachable.

Run inside or outside container:

```bash
npm run build
npm run lint
```

---

# Deliverables

Working repository commit.

Updated HANDOFF.md.

Updated PROJECT_STATE.md.

---

# Definition Of Done

Docker Compose starts the app.

Build succeeds.

Lint succeeds.

Documentation updated.

HANDOFF updated.

Ready for TASK-002.
