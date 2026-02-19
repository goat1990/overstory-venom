---
name: estimate
description: Analyze task complexity before spawning Overstory agents. Examines the codebase, classifies difficulty, recommends agent types and models, estimates cost, and detects risks. Use before overstory sling to make informed spawning decisions.
argument-hint: "<task-id-or-spec-path>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(wc *), Bash(git shortlog:*)
---

# Complexity Estimator

Analyze a task before spawning agents. Provides data-driven recommendations for agent type, model, decomposition, and risk.

## Input

`$ARGUMENTS` can be:
- A bead task ID (e.g., `overstory-abc1`) -- will read spec from `.overstory/specs/<id>.md`
- A file path to a spec (e.g., `docs/prds/PRD-001.md`)
- A brief description in quotes (e.g., `"add rate limiting to the API"`)

## Step 1: Scope Discovery

### If task ID or spec path
Read the spec and extract:
- Files mentioned
- Requirements listed
- Acceptance criteria

### If description only
Use Grep and Glob to find:
- Files matching keywords in the description
- Related test files
- Related config files
- Import chains from discovered files

### Build the file inventory

For each discovered file:
```bash
# Lines of code
wc -l <file>

# Recent change frequency (hotspot detection)
git log --oneline --since="3 months ago" -- <file> | wc -l

# Number of unique contributors (ownership complexity)
git shortlog -sn --since="6 months ago" -- <file>

# Coupling (files commonly changed together)
git log --oneline --since="3 months ago" --name-only -- <file> | sort | uniq -c | sort -rn | head -10
```

## Step 2: Complexity Dimensions

Score each dimension 1-5:

| Dimension | 1 (Low) | 3 (Medium) | 5 (High) |
|-----------|---------|-----------|----------|
| **Scope** | 1 file | 3-7 files | 8+ files |
| **Coupling** | No imports from other modified files | Some shared interfaces | Deeply interconnected |
| **Novelty** | Follows existing pattern exactly | Extends a pattern | New pattern or architecture |
| **Test gap** | Full test coverage exists | Partial coverage | No tests for affected area |
| **Hotspot** | <3 changes/3mo | 3-10 changes/3mo | 10+ changes/3mo (high churn) |
| **Risk** | Internal only, reversible | Affects shared interfaces | Affects external contracts or data |

**Composite score** = average of all dimensions.

## Step 3: Classification

| Score | Level | Strategy |
|-------|-------|----------|
| 1.0-1.5 | **trivial** | 1 builder, haiku model, no decomposition |
| 1.6-2.5 | **moderate** | 1 builder, sonnet model, single spec |
| 2.6-3.5 | **complex** | 1 lead + 2-4 builders, sonnet, decompose by domain |
| 3.6-4.5 | **hard** | 1 lead + 3-6 builders, opus lead + sonnet builders, scout first |
| 4.6-5.0 | **epic** | supervisor + leads + builders, opus supervisor, phased execution |

## Step 4: Decomposition Recommendation

If complexity >= complex:

### Identify natural boundaries
- **By layer**: API / business logic / UI / tests
- **By domain**: Auth / payments / notifications / data
- **By file coupling**: Group tightly-coupled files together
- **By dependency order**: Independent changes first, dependent changes later

### Generate task suggestions
For each suggested sub-task:
```
Task: <name>
  Capability: scout | builder | reviewer
  Model: haiku | sonnet | opus
  Files: <exact file list>
  Depends on: <other task names or "none">
  Estimated changes: ~<N> lines
```

## Step 5: Risk Assessment

### Conflict probability
- Check if any files in scope have open agent branches: `git branch -a | grep overstory/`
- Check if files are in anyone else's file scope (query active sessions)
- Rate: low (no overlap) / medium (shared read files) / high (shared write files)

### Failure modes
- **Missing tests**: Files without test coverage that will be modified
- **High churn**: Files changed >10 times in 3 months (likely to conflict)
- **Deep coupling**: Files imported by 5+ other files (changes ripple)
- **External deps**: Changes that touch external API contracts
- **Schema changes**: Database or config format modifications

### Mitigation recommendations
For each identified risk, suggest:
- Guard approach (e.g., "write tests first", "scout exploration before building")
- Fallback plan (e.g., "if conflict, merge in specific order")
- Monitoring (e.g., "watch for type errors in downstream files")

## Step 6: Cost Estimate

Estimate based on complexity and agent count:

| Model | Avg tokens/task | Approx cost/task |
|-------|----------------|-----------------|
| haiku | ~20K | ~$0.02 |
| sonnet | ~80K | ~$0.40 |
| opus | ~150K | ~$2.00 |

```
| Agent | Model | Estimated tokens | Estimated cost |
|-------|-------|-----------------|---------------|
| Total | | | |
```

## Output Format

```
## Complexity Report: <task-name>

### Score: X.X / 5.0 — <LEVEL>

### Dimensions
| Dimension | Score | Evidence |
|-----------|-------|---------|

### Files in scope
| File | Lines | Churn | Tests | Coupling | Risk |
|------|-------|-------|-------|----------|------|

### Recommendation
- **Agent strategy**: <description>
- **Model**: <recommendation>
- **Decomposition**: <yes/no, with reasoning>

### Suggested tasks (if decomposed)
| # | Task | Capability | Model | Files | Depends on |
|---|------|-----------|-------|-------|------------|

### Risk register
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|

### Estimated cost
| Agent | Model | Tokens | Cost |
|-------|-------|--------|------|
| **Total** | | | **$X.XX** |

### Ready-to-execute commands
<overstory sling commands if approved>
```

## Guardrails

- This is a READ-ONLY analysis. Do NOT create specs or spawn agents.
- Do NOT modify any files. Only read and analyze.
- Be conservative with complexity scores. When in doubt, round up.
- Always flag files with no test coverage as a risk.
- If the task description is too vague to analyze, say so and ask for more detail.
