---
name: full-stack
description: Implement a complete full-stack feature end-to-end, covering database schema, API endpoints, frontend UI, state management, tests, and E2E verification. Coordinates across all layers following project conventions. Use when a feature requires changes across the entire stack.
argument-hint: "<feature-description-or-spec-path>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(bun *), Bash(bunx *), Bash(npx *), Bash(tsc *), WebFetch
---

# Full-Stack Feature Implementation

Implement a feature across the entire stack: database, API, frontend, tests.

## Input

`$ARGUMENTS`: Feature description or path to a spec/PRD.

## Step 1: Stack Discovery

Identify the project's tech stack by examining existing code:

```
# Backend framework
Grep: "express\|fastify\|hono\|next.*api\|trpc" in package.json or imports
Glob: **/api/**/*.ts, **/routes/**/*.ts, **/server/**/*.ts

# Database
Grep: "prisma\|drizzle\|typeorm\|knex\|mongoose\|bun:sqlite" in package.json or imports
Glob: **/schema.prisma, **/drizzle.config.ts, **/migrations/**

# Frontend framework
Grep: "next\|remix\|vite\|expo\|react-native" in package.json
Glob: **/app/**/*.tsx, **/pages/**/*.tsx, **/src/**/*.tsx

# State management
Grep: "zustand\|redux\|jotai\|recoil\|tanstack.*query\|swr" in package.json or imports

# Testing
Grep: "vitest\|jest\|playwright\|cypress\|bun.*test" in package.json
Glob: **/*.test.ts, **/*.spec.ts, **/e2e/**
```

## Step 2: Feature Analysis

Based on the feature description:

1. **Data model**: What entities are involved? What are the relationships?
2. **API surface**: What endpoints are needed? (REST verbs or tRPC procedures)
3. **UI components**: What screens/components need to be built or modified?
4. **State management**: What client-side state is needed?
5. **Auth/permissions**: Does this feature need access control?
6. **Side effects**: Emails, notifications, webhooks, background jobs?

## Step 3: Implementation Order

Always follow this order (each step builds on the previous):

### Layer 1: Database / Schema
- Migration file for new tables/columns
- Model definitions (Prisma schema, Drizzle schema, etc.)
- Seed data if needed for development

### Layer 2: API / Backend Logic
- Type definitions for request/response
- Validation schemas (Zod, etc.)
- Route handlers or tRPC procedures
- Business logic (services/utils)
- Unit tests for business logic

### Layer 3: Frontend Components
- Type definitions for frontend models
- API client functions (fetch wrappers, tRPC hooks, etc.)
- UI components (following existing patterns + atomic design)
- State management (stores, hooks, context)
- Component tests

### Layer 4: Integration
- Connect frontend to API
- Error handling across the stack
- Loading states and optimistic updates
- Form validation (client + server)

### Layer 5: Testing
- Unit tests (per layer, already written above)
- Integration tests (API + database)
- E2E tests (if Playwright/Cypress available)
- Edge case tests (empty states, errors, permissions)

### Layer 6: Polish
- Error boundaries
- Loading skeletons
- Empty states
- Toast/notification feedback
- Keyboard shortcuts (if applicable)

## Step 4: File Creation

For each file, follow project conventions discovered in Step 1. Typical files for a feature:

```
# Database
prisma/migrations/XXXX_<feature>.sql  (or equivalent)

# API
src/api/<feature>/route.ts            (or src/server/routers/<feature>.ts)
src/api/<feature>/route.test.ts
src/lib/<feature>.ts                  (business logic)
src/lib/<feature>.test.ts

# Frontend
src/components/<feature>/             (component directory)
src/components/<feature>/index.tsx
src/components/<feature>/<Name>.tsx
src/components/<feature>/<Name>.test.tsx
src/hooks/use<Feature>.ts             (custom hooks)
src/stores/<feature>.ts               (if state management needed)

# E2E
tests/e2e/<feature>.spec.ts           (if Playwright/Cypress)
```

## Step 5: Quality Gates

Run ALL quality checks:

```bash
# Type safety across the entire stack
tsc --noEmit   # or bunx tsc --noEmit

# Lint and format
bun run lint    # or the project's lint command

# Unit tests
bun test        # or npm test / vitest

# E2E tests (if available and feature has them)
npx playwright test tests/e2e/<feature>.spec.ts
```

## Step 6: Documentation

Update relevant docs:
- API documentation (if the project maintains API docs)
- README if the feature is user-facing
- Migration notes if database changes are involved
- Environment variables if new config is needed

## Output

Present:
1. Files created/modified (with line counts)
2. Database changes summary
3. API endpoints added (method, path, description)
4. Components built (with states and props)
5. Test coverage summary
6. Any manual steps required (migrations, env vars, etc.)

## Guardrails

- ALWAYS start from the data model and work up. Never UI-first.
- NEVER skip validation. Validate at API boundary AND client-side.
- ALWAYS handle errors gracefully at every layer.
- NEVER store secrets or credentials in code.
- ALWAYS follow existing project patterns. Do not introduce new libraries.
- If the feature needs a library not in the project, flag it and ask before adding.
- ALWAYS write tests alongside implementation, not as an afterthought.
- Keep commits atomic: one logical change per commit.
