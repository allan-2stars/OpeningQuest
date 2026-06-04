# AI_WORKFLOW.md

# Opening Quest - AI Development Workflow

## Actual Setup

Primary Development Environment:
- Windows Laptop
- Claude Code Shell
- DeepSeek API
- 1M context
- No practical usage limit

Secondary Development Environment:
- Raspberry Pi
- Claude Code
- Limited usage/context

## Role Split

### Windows Agent

Owns:
- Project architecture
- Large implementation
- Data model
- Training engine
- Progression engine
- Storage
- Import/export
- Tests
- Major refactors
- Project planning

This is the project brain.

### Pi Agent

Owns:
- Small fixes
- Review
- Build verification
- Small UI improvements
- Documentation checks
- Accessibility checks

Pi Agent must not redesign architecture.

## Mandatory Process

One task.
One branch.
One responsible agent.

All implementation starts from docs/tasks.

## Context Recovery

Read:
1. docs/PROJECT_STATE.md
2. docs/DECISIONS.md
3. docs/HANDOFF.md
4. relevant task file
5. relevant system docs

Never guess from memory.

## Branch Strategy

main:
- stable only

dev:
- integration

feature branches:
- feature/project-bootstrap
- feature/core-data-layer
- feature/training-engine
- feature/adventure-map

## Definition of Done

- Code complete
- Build passes
- Lint passes
- Tests pass where applicable
- HANDOFF updated
- PROJECT_STATE updated if needed
- Commit created
