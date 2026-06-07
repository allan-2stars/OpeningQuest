# TASK-009 - PGN Import Export

Status: Complete
Priority: P2
Assigned Agent: Windows Agent

## Goal

Support Chess.com-compatible PGN import/export and JSON backup.

## Required Reading

- docs/DATA_MODEL.md
- docs/PRODUCT_DESIGN.md

## Requirements

Implement:
- Paste PGN import
- Export lesson/custom opening as PGN
- JSON backup export
- JSON backup import
- Basic validation/error messages

## Acceptance Criteria

- Valid PGN imports into OpeningLine
- Exported PGN can be copied elsewhere
- JSON backup fully restores local data
- Tests added for parser/exporter
- HANDOFF updated
