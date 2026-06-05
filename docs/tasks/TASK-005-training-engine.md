# TASK-005 - Training Engine

Status: Complete
Priority: P1
Assigned Agent: Windows Agent

## Goal

Implement core chess opening practice logic.

## Required Reading

- docs/GAMEPLAY_SYSTEM.md
- docs/DATA_MODEL.md
- docs/PROGRESSION_SYSTEM.md

## Requirements

Create:
- src/features/training/trainingEngine.ts
- src/features/training/types.ts
- tests for training engine

Support:
- Load lesson line
- Determine user side
- Validate legal moves with chess.js
- Validate expected move
- Guided Mode
- Instinct Mode
- Perfect run detection
- Mistake counting
- Session completion result

## Out of Scope

No UI polish.

No rewards.

No review scheduling.

## Acceptance Criteria

- Correct moves advance line
- Wrong moves in Guided Mode allow retry
- Wrong moves in Instinct Mode fail run
- Perfect run calculated correctly
- Unit tests pass
- HANDOFF updated
