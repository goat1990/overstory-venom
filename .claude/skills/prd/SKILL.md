---
name: prd
description: Process a Product Requirements Document (PRD) into executable Overstory specs and agent commands. Analyzes the codebase, classifies complexity, decomposes into tasks with file scopes, generates specs, and outputs a ready-to-execute sling plan. Use when starting a new feature from a PRD or requirements document.
argument-hint: "<path-to-prd>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(wc *), Bash(overstory spec write *)
---

# PRD Processor

Transform a Product Requirements Document into an executable Overstory agent plan.

## Input

Read the PRD at: `$ARGUMENTS`

If no path is provided, ask the user for the PRD location or accept inline content.

## Phase 1: PRD Analysis

Extract and validate these sections from the PRD:

### Required
- **Objective** (also: "Objetivo"): What is being built and why
- **Functional Requirements** (also: "Requisitos funcionales"): Numbered list (RF-01, RF-02, ...)
- **Acceptance Criteria** (also: "Criterios de aceptacion"): Testable acceptance criteria (AC-01, AC-02, ...)

### Optional (infer if missing)
- **Target Users** (also: "Usuarios objetivo"): Who benefits
- **Non-Functional Requirements** (also: "Requisitos no funcionales"): Performance, security, accessibility
- **Dependencies** (also: "Dependencias externas"): APIs, services, packages
- **Out of Scope** (also: "Fuera de alcance"): What is explicitly excluded
- **Risks** (also: "Riesgos"): Known risks and mitigations

Accept both English and Spanish header variants. The PRD templates use English headers; older documents may use Spanish.

If any required section is missing or vague, list what is missing and ask the user to clarify before proceeding.

## Phase 2: Codebase Impact Analysis

For each functional requirement:

1. **File discovery**: Use Glob and Grep to find files that would be affected
2. **Dependency mapping**: Check imports/exports to understand coupling between files
3. **Hotspot detection**: Run `git log --oneline --since="3 months ago" -- <file>` on affected files to detect high-churn areas
4. **Test coverage**: Check if `*.test.ts` files exist for affected modules
5. **Size estimation**: Use `wc -l` on affected files to gauge scope

Build a table:

```text
| File | Lines | Imports | Tests? | Git churn (3mo) | Risk |
|------|-------|---------|--------|-----------------|------|
```

## Phase 3: Complexity Classification

For each functional requirement, classify based on impact analysis:

| Level | Criteria | Agent Strategy |
|-------|----------|----------------|
| **trivial** | 1 file, <50 lines change, no coupling | 1 builder (haiku) |
| **moderate** | 2-5 files, clear interfaces, existing patterns | 1 builder (sonnet) |
| **complex** | 5-15 files, multiple domains, new patterns | 1 lead + N builders |
| **epic** | 15+ files, architectural changes, new subsystems | 1 supervisor + leads + builders |

Overall PRD complexity = highest individual requirement complexity.

## Phase 4: Task Decomposition

Group related requirements into tasks. Each task must have:

1. **Task name**: Descriptive, action-oriented (e.g., "Implement auth middleware")
2. **Capability**: scout | builder | reviewer | lead (based on complexity)
3. **File scope**: Exact list of files this agent owns (no overlaps between tasks)
4. **Dependencies**: Which other tasks must complete first
5. **Acceptance criteria**: Subset of PRD criteria this task satisfies
6. **Model recommendation**: haiku | sonnet | opus (based on complexity)

### Decomposition Rules

- **No file overlap**: Two tasks must NEVER share a file in their scope
- **Minimize dependencies**: Prefer parallel-executable tasks
- **Scout first**: If requirements are ambiguous, create a scout task first to explore
- **Review last**: Add a reviewer task as the final phase
- **Group by domain**: Keep related files in the same task (e.g., all API routes together)

## Phase 5: Spec Generation

For each task, generate a spec using `overstory spec write`:

```bash
overstory spec write <task-id> --body "$(cat <<'SPEC'
# Task: <task-name>

## Objective
<What this task accomplishes in the context of the PRD>

## Functional Requirements
<Subset of PRD requirements this task implements>

## Files to Modify
<Exact file list with brief description of changes per file>

## Implementation Notes
- <Pattern to follow from existing codebase>
- <Edge cases to handle>
- <Integration points with other tasks>

## Acceptance Criteria
<Testable criteria from the PRD>

## Dependencies
- Depends on: <task-ids or "none">
- Depended on by: <task-ids or "none">
SPEC
)"
```

## Phase 6: Execution Plan

Generate the complete execution plan as a phased sling sequence:

```bash
## Phase 0: Exploration (if needed)
overstory sling <task-id> --capability scout --name <name> --spec <path>

## Phase 1: Foundation (no dependencies, run in parallel)
overstory sling <task-id> --capability builder --name <name> --spec <path> --files <f1,f2>
overstory sling <task-id> --capability builder --name <name> --spec <path> --files <f3,f4>

## Phase 2: Integration (depends on Phase 1)
overstory sling <task-id> --capability builder --name <name> --spec <path> --files <f5,f6>

## Phase N: Validation
overstory sling <task-id> --capability reviewer --name <name> --spec <path>
```

## Output Format

Present the complete plan as:

### 1. PRD Summary
3-5 line summary of what is being built.

### 2. Impact Analysis Table
Files affected, risk levels, test gaps.

### 3. Task Breakdown Table

```text
| # | Task | Complexity | Capability | Model | Files | Depends On |
|---|------|-----------|-----------|-------|-------|------------|
```

### 4. Dependency Graph (ASCII)

```text
scout-explore ──┐
                ├──> builder-api ──┐
                │                  ├──> builder-integration ──> reviewer-final
                ├──> builder-ui ───┘
                │
                └──> builder-tests
```

### 5. Execution Commands
Ready-to-paste `overstory sling` commands grouped by phase.

### 6. Cost Estimate

```text
| Phase | Agents | Estimated model | Approximate tokens |
|-------|--------|----------------|--------------------|
```

### 7. Risk Register
Risks inherited from the PRD + new risks discovered during analysis.

## Guardrails

- NEVER generate specs for requirements you don't understand. Ask first.
- NEVER overlap file scopes between tasks.
- ALWAYS include a reviewer task as the final phase.
- ALWAYS check that acceptance criteria are testable (not vague).
- If the PRD references external services not yet integrated, flag as a blocker.
- If estimated agent count exceeds `maxConcurrent` from config, split into waves.
