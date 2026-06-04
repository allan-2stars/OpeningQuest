# TECHNICAL_STANDARDS.md

# Opening Quest - Technical Standards

## TypeScript

- Strict mode enabled.
- `verbatimModuleSyntax` for ESM compatibility.
- All domain types defined in `src/types/domain.ts`.
- No `any` unless absolutely necessary — use `unknown` and type guards.

## Naming

- Files: kebab-case (`lesson-progress.ts`)
- Components: PascalCase (`AppShell.tsx`)
- Functions: camelCase (`getUserProfile`)
- Types: PascalCase (`LessonProgress`)
- Database tables: camelCase (`lessonProgress`)

## Imports

- Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`).
- Barrel exports from `src/types/domain.ts` only — feature types live with features.

## React Components

- Functional components only.
- No default export for utilities/services/repositories — named exports only.
- Default export for page components and feature entry points.

## Storage

- All IndexedDB access through Dexie.
- Repository functions only — no direct `db.table` access from components or services.
- Database versioning via Dexie schema versions.

## Testing

- Unit tests with Vitest.
- Repository tests hit a real Dexie instance (in-memory IndexedDB via fake-indexeddb).
- No mocking of the database layer.

## Git

- One task, one branch.
- Commit messages: conventional commit style (`feat:`, `fix:`, `chore:`).
