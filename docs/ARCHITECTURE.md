# ARCHITECTURE.md

# Opening Quest - Architecture

## Overview

Opening Quest is an offline-first, tablet-first PWA built with React + Vite + TypeScript.

## Layer Architecture

```
UI (React components)
    |
State (Zustand stores)
    |
Services (business logic)
    |
Repositories (data access)
    |
Dexie/IndexedDB (persistence)
```

## Key Principles

- UI never accesses IndexedDB/Dexie directly — all data flows through repositories.
- Services contain business logic and orchestrate repository calls.
- Zustand stores hold UI state; domain data lives in IndexedDB.
- All storage access is async and typed.

## Directory Map

| Directory | Purpose |
|-----------|---------|
| `src/app/` | App root, router setup |
| `src/components/` | Shared UI components |
| `src/features/` | Feature-specific pages and components |
| `src/hooks/` | Shared React hooks |
| `src/lib/` | Database, repositories, seed data, utilities |
| `src/services/` | Business logic layer |
| `src/stores/` | Zustand state stores |
| `src/types/` | TypeScript type definitions |
| `src/assets/` | Static assets |

## Data Flow

1. User action triggers a Zustand store action
2. Store calls a service function
3. Service applies business rules, calls repository
4. Repository reads/writes Dexie/IndexedDB
5. Store updates UI state from service result

## Offline-First

- All data is local in IndexedDB via Dexie.
- No backend API calls in V1.
- No cloud sync in V1.
- Architecture must support future sync layer insertion between services and repositories.
