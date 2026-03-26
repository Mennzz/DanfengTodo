# DanfengTodo — Database Design Document

## Overview

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Schema file**: `prisma/schema.prisma`
- **ID strategy**: `cuid()` for all primary keys

---

## Entity Relationship Summary

```
User
  ├── ownedCategories → Category[] (1:N, via Category.ownerId)
  └── sharedCategories → CategoryShare[] (N:M bridge)

Category
  ├── owner → User (N:1, via ownerId)
  ├── shares → CategoryShare[] (1:N)
  ├── Week[] (1:N)
  │     ├── Todo[] (1:N, self-referential for subtasks)
  │     ├── WeekReflection (1:1)
  │     └── WeekPlan (1:1)
  │           └── PlanTask[] (1:N)
  ├── DayTag[] (1:N)
  ├── DayNote[] (1:N)
  └── WeekGenerationLog (1:1)

CategoryShare (bridge)
  ├── category → Category
  └── user → User
```

---

## Models

### `User`

Represents an authenticated user. Owns categories and can be shared on others' categories.

| Column       | Type     | Constraints              | Notes                              |
|--------------|----------|--------------------------|------------------------------------|
| id           | String   | PK, cuid                 |                                    |
| email        | String   | UNIQUE                   |                                    |
| name         | String?  |                          | Display name, optional             |
| passwordHash | String   |                          | bcrypt hash, never returned to client |
| role         | Role     | default `USER`           | Enum: `ADMIN`, `USER`              |
| createdAt    | DateTime | default `now()`          |                                    |
| updatedAt    | DateTime | auto-updated             |                                    |

**Access rules**:
- `ADMIN` — can read and write all categories
- `USER` — can only access categories they own or have been shared with

---

### `CategoryShare`

Bridge table for sharing a category with another user. All shared users get full view + edit access (no permission tiers).

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, cuid                 |
| categoryId | String   | FK → Category            |
| userId     | String   | FK → User                |
| createdAt  | DateTime | default `now()`          |

**Unique**: `(categoryId, userId)`
**Indexes**: `userId`

---

### `Category`

Top-level container. Owned by a user; can be shared with others.

| Column      | Type     | Constraints              | Notes                    |
|-------------|----------|--------------------------|--------------------------|
| id          | String   | PK, cuid                 |                          |
| name        | String   |                          |                          |
| color       | String   | default `#3B82F6`        | Hex color for UI display |
| isDefault   | Boolean  | default `false`          | Marks the default category |
| order       | Int      | default `0`              | Display sort order       |
| ownerId     | String   | FK → User                | The user who created it  |
| createdAt   | DateTime | default `now()`          |                          |
| updatedAt   | DateTime | auto-updated             |                          |

**Indexes**: `order`, `ownerId`

---

### `Week`

Represents one ISO calendar week within a category. Ties todos, reflections, and plans together.

| Column      | Type     | Constraints              | Notes                        |
|-------------|----------|--------------------------|------------------------------|
| id          | String   | PK, cuid                 |                              |
| categoryId  | String   | FK → Category            | Cascade delete               |
| startDate   | DateTime |                          | Monday of the week           |
| endDate     | DateTime |                          | Sunday of the week           |
| weekNumber  | Int      |                          | ISO week number (1–53)       |
| year        | Int      |                          |                              |
| createdAt   | DateTime | default `now()`          |                              |

**Unique**: `(categoryId, startDate)`
**Indexes**: `(categoryId, startDate)`, `(year, weekNumber)`

---

### `Todo`

A task belonging to a week. Supports one level of subtasks via self-relation.

| Column      | Type     | Constraints              | Notes                             |
|-------------|----------|--------------------------|-----------------------------------|
| id          | String   | PK, cuid                 |                                   |
| weekId      | String   | FK → Week                | Cascade delete                    |
| content     | String   |                          | Task text                         |
| completed   | Boolean  | default `false`          |                                   |
| dueDate     | DateTime |                          | Day within the week               |
| order       | Int      | default `0`              | Display sort order within the day |
| parentId    | String?  | FK → Todo (self)         | Null = top-level todo             |
| createdAt   | DateTime | default `now()`          |                                   |
| updatedAt   | DateTime | auto-updated             |                                   |
| completedAt | DateTime?|                          | Set when completed                |

**Indexes**: `(weekId, dueDate, order)`, `completed`, `parentId`

**Notes**:
- Subtask depth is implicitly one level only (no recursive nesting enforced at DB level, only UI convention).
- `dueDate` stores the specific day, not just a day-of-week string. Queried as full DateTime.

---

### `WeekReflection`

One free-text reflection note per week per category (via Week).

| Column    | Type     | Constraints     |
|-----------|----------|-----------------|
| id        | String   | PK, cuid        |
| weekId    | String   | FK → Week, UNIQUE |
| content   | String   | default `""`    |
| createdAt | DateTime | default `now()` |
| updatedAt | DateTime | auto-updated    |

---

### `WeekPlan`

One weekly plan per week. Contains a main goal and a list of plan tasks.

| Column    | Type     | Constraints       |
|-----------|----------|-------------------|
| id        | String   | PK, cuid          |
| weekId    | String   | FK → Week, UNIQUE |
| mainGoal  | String   | default `""`      |
| createdAt | DateTime | default `now()`   |
| updatedAt | DateTime | auto-updated      |

---

### `PlanTask`

A task in the weekly plan. Can be assigned to a day and linked to a generated Todo.

| Column      | Type    | Constraints       | Notes                                       |
|-------------|---------|-------------------|---------------------------------------------|
| id          | String  | PK, cuid          |                                             |
| planId      | String  | FK → WeekPlan     | Cascade delete                              |
| content     | String  |                   |                                             |
| order       | Int     |                   | Sort order in plan list                     |
| assignedDay | String? |                   | Day name (e.g. `"Monday"`) or null          |
| todoId      | String? |                   | Soft link to generated Todo (no FK constraint) |
| createdAt   | DateTime| default `now()`   |                                             |
| updatedAt   | DateTime| auto-updated      |                                             |

**Indexes**: `(planId, order)`

**Notes**:
- `todoId` is a soft reference — no foreign key enforced. If the linked Todo is deleted, `todoId` becomes stale.

---

### `DayTag`

A single emoji/tag label per category per day.

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, cuid                 |
| categoryId | String   | FK → Category            |
| date       | DateTime |                          |
| tag        | String   | Emoji or short label     |
| createdAt  | DateTime | default `now()`          |
| updatedAt  | DateTime | auto-updated             |

**Unique**: `(categoryId, date)`
**Indexes**: `(categoryId, date)`

---

### `DayNote`

A free-text daily note per category per day.

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, cuid                 |
| categoryId | String   | FK → Category            |
| date       | DateTime |                          |
| content    | String   | default `""`             |
| createdAt  | DateTime | default `now()`          |
| updatedAt  | DateTime | auto-updated             |

**Unique**: `(categoryId, date)`
**Indexes**: `(categoryId, date)`

---

### `WeekGenerationLog`

Tracks auto-generation of weeks per category (prevents duplicate week scaffolding).

| Column          | Type     | Constraints              |
|-----------------|----------|--------------------------|
| id              | String   | PK, cuid                 |
| categoryId      | String   | FK → Category, UNIQUE    |
| lastGeneratedAt | DateTime | default `now()`          |
| weeksGenerated  | Int      | default `0`              |

---

## Migration History

| Migration                              | Date       | Changes                                           |
|----------------------------------------|------------|---------------------------------------------------|
| `20260107114013_init`                  | 2026-01-07 | Initial schema: Category, Week, Todo              |
| `20260107152628_add_day_tags`          | 2026-01-07 | Added DayTag model                                |
| `20260107160109_add_week_reflection`   | 2026-01-07 | Added WeekReflection model                        |
| `20260108140030_add_subtasks`          | 2026-01-08 | Added `parentId` self-relation on Todo            |
| `20260319000000_add_day_notes_week_plan` | 2026-03-19 | Added DayNote, WeekPlan, PlanTask models          |
| `20260319154737_add_users_and_sharing`   | 2026-03-19 | Add User (Role enum), CategoryShare; ownerId on Category |

---

## Design Notes & Potential Issues

### Current Limitations

1. **`PlanTask.todoId` is a soft reference** — no FK constraint means stale references are possible if a Todo is deleted after being generated from a plan task.

2. **Subtask depth not enforced** — `Todo.parentId` allows one level of nesting by UI convention only. A DB-level constraint (e.g. check that parent has no parentId) does not exist.

3. **`DayTag.tag` is untyped String** — no enum or validation at DB level; validation is purely in application code.

4. **`Week.endDate` is redundant** — it can always be derived from `startDate + 6 days`. Storing it is a denormalization.

5. **`WeekGenerationLog.categoryId` is UNIQUE** — meaning only one log per category (not per-year or per-period). The `weeksGenerated` counter is cumulative with no reset mechanism.

6. **User/auth model at DB level only** — `User`, `CategoryShare`, and `Category.ownerId` are migrated. Application-level auth (NextAuth.js, API route guards, login page) is not yet implemented.

### Index Coverage

- `Todo` queries by `(weekId, dueDate, order)` are well-covered.
- `DayTag` and `DayNote` queries by `(categoryId, date)` are well-covered.
- `Week` queries by `(year, weekNumber)` are covered but cross-category (no `categoryId` in that index).
