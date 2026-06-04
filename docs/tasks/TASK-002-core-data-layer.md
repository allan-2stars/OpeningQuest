# TASK-002 - Core Data Layer

Status: Ready
Priority: P0
Assigned Agent: Windows Agent

## Goal

Implement the local offline-first data foundation using TypeScript types and Dexie.

## Required Reading

- CLAUDE.md
- docs/DATA_MODEL.md
- docs/PROJECT_STATE.md
- docs/DECISIONS.md

## Requirements

Create:
- src/types/domain.ts
- src/lib/db.ts
- src/lib/repositories/
- src/lib/seed/
- src/lib/date.ts

Implement:
- World
- OpeningFamily
- Variation
- Lesson
- OpeningLine
- UserProfile
- LessonProgress
- TrainingSession
- Achievement
- PieceSkin
- BoardTheme
- DailyQuest

Create repository functions for:
- user profile
- lesson progress
- curriculum read
- rewards inventory

## Out of Scope

No UI changes except minimal debug page if needed.

No training engine.

No PGN import/export.

## Acceptance Criteria

- Dexie database initializes
- Seed data can be inserted
- User profile can be created/read/updated
- Lesson progress can be created/read/updated
- Tests added for repository functions
- HANDOFF updated
