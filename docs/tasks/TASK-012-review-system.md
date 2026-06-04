# TASK-012 - Review System

Status: Ready
Priority: P2
Assigned Agent: Windows Agent

## Goal

Implement spaced repetition and review queue.

## Required Reading

- docs/GAMEPLAY_SYSTEM.md
- docs/PROGRESSION_SYSTEM.md
- docs/DATA_MODEL.md

## Requirements

- Review due detection
- Review queue
- Review success/failure
- Mastery decay after 2 failures
- Daily training priority integration

## Acceptance Criteria

- Due lessons appear in review queue
- Successful review schedules next interval
- Failed review increments failure count
- 2 failures decrease mastery
- Tests added
- HANDOFF updated
