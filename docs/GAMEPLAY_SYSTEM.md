# GAMEPLAY_SYSTEM.md

# Opening Quest - Gameplay System

## Core Philosophy

Opening Quest is a memory training game using chess openings.

Success means the player can recall the correct opening move automatically.

## Lesson Structure

A lesson contains:
- One opening family
- One variation
- One side: white or black
- One opening line
- 5-7 move depth by default

## Practice Modes

### Guided Mode

Used for learning.

Wrong move:
1. Show mistake
2. Highlight correct move
3. Allow retry
4. No penalty

### Instinct Mode

Used for mastery.

Wrong move:
1. End current run
2. Restart line
3. No hint

## Perfect Run

A perfect run means completing the whole lesson with zero mistakes.

## Mastery

A lesson is mastered after:
- 10 perfect runs

Mastery levels:
- 0 Unknown
- 1 Learning: 1-3 perfect runs
- 2 Developing: 4-6 perfect runs
- 3 Strong: 7-9 perfect runs
- 4 Mastered: 10 perfect runs

## Mastery Decay

After 2 failed reviews:
- mastery drops by 1 level

## Review Schedule

After mastery:
- 1 day
- 3 days
- 7 days
- 14 days
- 30 days
- 60 days
- 90 days
- 180 days
- 365 days

## Boss Battles

Boss battles verify mastery.

Boss battles mix positions from completed lessons in the world.

Allowed mistakes:
- 3

Failure:
- retry later
- no penalty

## Daily Training Priority

1. Review due lessons
2. Weak lessons
3. Current lesson
4. Optional practice
