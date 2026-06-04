# CLAUDE.md

# Opening Quest - AI Coding Instructions

## Project Mission

Opening Quest is a tablet-first chess adventure game focused on chess opening mastery.

The goal is to help players memorize openings and defenses through repetition, mastery, progression maps, rewards, and long-term review.

The app is not a chess platform, not an online chess game, not a full analysis database, and not a social network.

## Primary Users

- Kids aged 8-14 learning chess
- Adult beginner/intermediate chess players
- Players who want to memorize their opening repertoire

## Core Product Rule

Opening mastery comes first.

Do not add features that distract from:
- Practicing openings
- Repeating lines
- Correcting mistakes
- Mastering lessons
- Reviewing retained knowledge

## Technical Stack

Use:
- React
- Vite
- TypeScript
- TailwindCSS
- Zustand
- chess.js
- react-chessboard
- Dexie / IndexedDB
- PWA

Do not use:
- Next.js
- Backend APIs in V1
- React Native in V1
- Redux unless explicitly approved
- Server-side auth in V1

## Architecture Direction

V1 is offline-first.

All user progress is local.

Future cloud sync may exist later, but do not build it now.

## Required Reading Before Tasks

Always read:
- docs/PROJECT_STATE.md
- docs/DECISIONS.md
- The relevant task file in docs/tasks/

Then read only the relevant system documents:
- docs/PRODUCT_DESIGN.md
- docs/UI_DESIGN.md
- docs/GAMEPLAY_SYSTEM.md
- docs/DATA_MODEL.md
- docs/PROGRESSION_SYSTEM.md
- docs/REWARD_SYSTEM.md
- docs/OPENING_CURRICULUM.md

## Development Rule

One task.
One branch.
One focused implementation.

Do not implement future tasks early.

## Definition of Done

A task is complete only when:
- Code builds
- Lint passes
- Tests pass where applicable
- docs/HANDOFF.md is updated
- docs/PROJECT_STATE.md is updated if status changes
- Acceptance criteria are met

## Scope Protection

Do not add:
- Multiplayer
- Chat
- Social features
- Cloud sync
- Payments
- Ads
- Stockfish
- AI coach
- Parent dashboard

unless a task explicitly asks for it.
