# Implementation Plan: PRD-Driven Development System

## Executive Summary

This plan transforms Overstory from a manually-orchestrated agent system into a **PRD-driven development platform** where a single requirements document automatically decomposes into agent tasks, spawns the right agents with the right models, and verifies completion against acceptance criteria.

The system adds three new layers:

1. **Skills Layer** -- 6 new skills for PRD processing, complexity analysis, design-to-code, full-stack features, and mobile screens
2. **MCP Layer** -- 5 external tool integrations (GitHub, Playwright, Figma, Sentry, Context7)
3. **Templates Layer** -- PRD templates for general and design-oriented features

---

## Architecture Overview

```
                          ┌─────────────────────────┐
                          │     PRD Document         │
                          │  (docs/prds/*.md)        │
                          └──────────┬──────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │    /prd or /prd-design   │
                          │    (Claude Skill)        │
                          └──────────┬──────────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   │                 │                   │
          ┌────────▼──────┐ ┌───────▼───────┐ ┌────────▼──────┐
          │   /estimate   │ │  Codebase     │ │  MCP Data     │
          │   Complexity  │ │  Analysis     │ │  (Figma, DB)  │
          │   Scoring     │ │  (Grep, Glob) │ │               │
          └────────┬──────┘ └───────┬───────┘ └────────┬──────┘
                   │                │                   │
                   └─────────────────┼─────────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │   Task Decomposition    │
                          │   + Spec Generation     │
                          │   (overstory spec write) │
                          └──────────┬──────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │   Execution Plan        │
                          │   (overstory sling ×N)  │
                          └──────────┬──────────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              │                      │                        │
    ┌─────────▼─────────┐ ┌─────────▼─────────┐  ┌──────────▼─────────┐
    │  /design-to-code  │ │   /full-stack      │  │  /mobile-screen    │
    │  (UI Components)  │ │   (All Layers)     │  │  (Native Screens)  │
    └─────────┬─────────┘ └─────────┬─────────┘  └──────────┬─────────┘
              │                      │                        │
              └──────────────────────┼───────────────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │   Overstory Agents      │
                          │   (scouts, builders,    │
                          │    leads, reviewers)    │
                          └──────────┬──────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │   overstory merge       │
                          │   + Quality Gates       │
                          └─────────────────────────┘
```

---

## What Was Built

### Skills (6 new)

| Skill | Path | Invocation | Purpose |
|-------|------|------------|---------|
| **prd** | `.claude/skills/prd/SKILL.md` | `/prd <path>` | Process a PRD into executable agent tasks |
| **prd-design** | `.claude/skills/prd-design/SKILL.md` | `/prd-design <path>` | Process a design-heavy PRD with Figma extraction |
| **estimate** | `.claude/skills/estimate/SKILL.md` | `/estimate <task>` | Analyze complexity before spawning agents |
| **design-to-code** | `.claude/skills/design-to-code/SKILL.md` | `/design-to-code <ref>` | Convert designs to production components |
| **full-stack** | `.claude/skills/full-stack/SKILL.md` | `/full-stack <desc>` | Implement a feature across all stack layers |
| **mobile-screen** | `.claude/skills/mobile-screen/SKILL.md` | `/mobile-screen <name>` | Build a complete mobile screen |

### Existing Skills (3, unchanged)

| Skill | Path | Invocation |
|-------|------|------------|
| **pr-reviews** | `.claude/commands/pr-reviews.md` | `/pr-reviews [numbers]` |
| **issue-reviews** | `.claude/commands/issue-reviews.md` | `/issue-reviews [numbers]` |
| **release** | `.claude/commands/release.md` | `/release [major\|minor\|patch]` |

### Templates (2 new)

| Template | Path | Use with |
|----------|------|----------|
| **General PRD** | `docs/prds/templates/prd-template.md` | `/prd` |
| **Design PRD** | `docs/prds/templates/prd-design-template.md` | `/prd-design` |

### MCP Configuration (1 new)

| File | Path | Servers |
|------|------|---------|
| **MCP Config** | `.mcp.json` | GitHub, Playwright, Figma, Sentry, Context7 |

---

## Skill Details

### `/prd` -- PRD Processor

**What it does:**
1. Reads a PRD document
2. Extracts requirements, acceptance criteria, dependencies
3. Scans the codebase for impacted files (Grep + Glob)
4. Checks git history for hotspots and churn
5. Classifies each requirement's complexity (trivial/moderate/complex/epic)
6. Decomposes into non-overlapping agent tasks with file scopes
7. Generates specs via `overstory spec write`
8. Outputs phased `overstory sling` commands ready to execute

**Complexity classification rules:**
| Level | Files | Strategy |
|-------|-------|----------|
| trivial | 1 file, <50 lines | 1 builder (haiku) |
| moderate | 2-5 files, clear interfaces | 1 builder (sonnet) |
| complex | 5-15 files, multiple domains | 1 lead + N builders |
| epic | 15+ files, architectural | 1 supervisor + leads + builders |

**Key guardrails:**
- No file scope overlap between tasks
- Always includes a reviewer task as final phase
- Validates acceptance criteria are testable
- Respects `maxConcurrent` agent limit from config

### `/prd-design` -- Design PRD Processor

**What it does:**
1. Everything `/prd` does, PLUS:
2. Extracts design tokens from Figma (via MCP or manual)
3. Maps screens to atomic design hierarchy (atoms -> molecules -> organisms -> pages)
4. Documents responsive behavior per breakpoint
5. Generates mobile-specific tasks if cross-platform
6. Produces a Figma-to-code mapping table

**Implementation order:**
```
Wave 1: Design tokens + atoms (parallel)
Wave 2: Molecules (depend on atoms)
Wave 3: Organisms (depend on molecules)
Wave 4: Pages + integration
Wave 5: Testing + review
```

### `/estimate` -- Complexity Analyzer

**What it does (READ-ONLY):**
1. Accepts a task ID, spec path, or text description
2. Discovers affected files via code search
3. Scores 6 complexity dimensions (1-5 each):
   - Scope, Coupling, Novelty, Test gap, Hotspot, Risk
4. Classifies overall complexity
5. Recommends agent strategy and model selection
6. Estimates token cost
7. Identifies risks and mitigations

**Does NOT:**
- Create specs
- Spawn agents
- Modify any files

### `/design-to-code` -- Design Converter

**What it does:**
1. Takes Figma URL, component name, or mockup image
2. Detects target platform (React web, React Native, or both)
3. Discovers existing project styling patterns
4. Generates or uses existing design tokens
5. Creates component files with:
   - Full TypeScript props
   - All states (default, hover, focus, disabled, loading, error, empty)
   - Accessibility attributes (WCAG 2.1 AA)
   - Responsive behavior
6. Creates test files
7. Creates Storybook stories (if project uses Storybook)

### `/full-stack` -- Full-Stack Feature Builder

**What it does:**
1. Detects the project's tech stack automatically
2. Implements in strict layer order:
   - Database schema -> API endpoints -> Frontend UI -> Integration -> Tests -> Polish
3. Follows existing project patterns (no new libraries without approval)
4. Runs all quality gates

### `/mobile-screen` -- Mobile Screen Builder

**What it does:**
1. Detects mobile framework (Expo, bare RN, cross-platform)
2. Detects navigation library (React Navigation, Expo Router)
3. Builds screen with all states (loading, error, empty, data, offline)
4. Integrates with navigation stack
5. Handles gestures, accessibility, and platform-specific behavior
6. Creates tests (unit, snapshot, integration)

---

## MCP Server Details

### `.mcp.json` Configuration

5 servers configured, all using official endpoints:

| Server | Transport | Purpose | Auth method |
|--------|-----------|---------|-------------|
| **GitHub** | HTTP | PRs, issues, code review, repo ops | OAuth via `/mcp` |
| **Playwright** | stdio | E2E testing, browser automation, screenshots | None (local) |
| **Figma** | HTTP | Design extraction, tokens, components | OAuth via `/mcp` |
| **Sentry** | HTTP | Error monitoring, stack traces, debugging | OAuth via `/mcp` |
| **Context7** | stdio | Up-to-date library docs for any framework | None (free API) |

### How to authenticate
After starting Claude Code:
1. Type `/mcp` in the chat
2. Follow OAuth prompts for GitHub, Figma, and Sentry
3. Playwright and Context7 work without authentication

### How to add more servers later

```bash
# Database (PostgreSQL)
claude mcp add --scope project team-db -- npx -y @modelcontextprotocol/server-postgres "postgresql://..."

# Supabase
claude mcp add --scope project supabase -- npx -y @supabase/mcp-server

# Expo (React Native)
claude mcp add --scope project expo -- npx -y @mattlemmone/expo-mcp

# Linear (project management)
claude mcp add --transport http --scope project linear https://mcp.linear.app/mcp

# Neon (serverless Postgres)
claude mcp add --scope project neon -- npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY

# AWS Core (install first for all AWS servers)
claude mcp add --scope project awslabs.core-mcp-server -- uvx awslabs.core-mcp-server@latest

# Vercel
claude mcp add --transport http --scope project vercel https://mcp.vercel.com/mcp
```

---

## Workflow Examples

### Example 1: New feature from PRD

```bash
# 1. Write the PRD using the template
cp docs/prds/templates/prd-template.md docs/prds/PRD-007-user-dashboard.md
# Edit the PRD...

# 2. Analyze complexity first (optional but recommended)
/estimate "user dashboard with analytics widgets and real-time data"

# 3. Process the PRD into agent tasks
/prd docs/prds/PRD-007-user-dashboard.md

# 4. Review the execution plan, then run the sling commands
# (the skill outputs ready-to-paste commands)
```

### Example 2: Design-heavy feature

```bash
# 1. Write the design PRD
cp docs/prds/templates/prd-design-template.md docs/prds/PRD-008-checkout-flow.md
# Add Figma links, screen inventory, component hierarchy...

# 2. Process with design-aware skill
/prd-design docs/prds/PRD-008-checkout-flow.md

# 3. The skill extracts design tokens, maps components,
#    generates specs following atomic design order
```

### Example 3: Quick mobile screen

```bash
# Direct implementation without full PRD
/mobile-screen ProfileSettings

# The skill detects your mobile framework, navigation,
# styling system, and builds a complete screen
```

### Example 4: Figma to code

```bash
# Convert a Figma frame to code
/design-to-code https://figma.com/design/abc123/MyApp?node-id=1234

# The skill uses Figma MCP to extract design data,
# generates typed components with tests
```

---

## File Inventory

```
NEW FILES CREATED:
├── .mcp.json                                          # MCP server configuration
├── .claude/skills/
│   ├── prd/SKILL.md                                   # PRD processor skill
│   ├── prd-design/SKILL.md                            # Design PRD processor skill
│   ├── estimate/SKILL.md                              # Complexity analyzer skill
│   ├── design-to-code/SKILL.md                        # Design-to-code converter skill
│   ├── full-stack/SKILL.md                            # Full-stack feature builder skill
│   └── mobile-screen/SKILL.md                         # Mobile screen builder skill
├── docs/
│   ├── IMPLEMENTATION-PLAN.md                         # This document
│   └── prds/templates/
│       ├── prd-template.md                            # General PRD template
│       └── prd-design-template.md                     # Design-oriented PRD template

EXISTING FILES (unchanged):
├── .claude/commands/
│   ├── pr-reviews.md                                  # PR review skill
│   ├── issue-reviews.md                               # Issue review skill
│   └── release.md                                     # Release preparation skill
├── .claude/settings.json                              # Claude Code settings
└── CLAUDE.md                                          # Project instructions
```

---

## Security Considerations

1. **No secrets in `.mcp.json`**: All authentication uses OAuth flows via `/mcp`, not hardcoded tokens
2. **Skills are read-only by default**: `/estimate` cannot modify files. `/prd` only writes specs via `overstory spec write`
3. **MCP servers use official endpoints**: No third-party proxies
4. **Playwright runs locally**: No remote browser access
5. **File scope enforcement**: Skills that write code (`/design-to-code`, `/full-stack`, `/mobile-screen`) respect project conventions

## Maintenance

### Updating skills
Edit the `SKILL.md` file directly. Changes take effect immediately on next invocation. No build step.

### Adding new MCPs
```bash
claude mcp add --scope project <name> -- <command> [args]
# or edit .mcp.json directly
```

### Monitoring MCP status
Type `/mcp` in any Claude Code session to see server health and authentication status.

### Skill discovery
All skills in `.claude/skills/` are auto-discovered. Claude sees their descriptions and invokes them when relevant (unless `disable-model-invocation: true`).

---

## What This Enables

| Before | After |
|--------|-------|
| Manually write specs for each agent | `/prd` auto-decomposes PRD into specs |
| Guess at complexity and agent types | `/estimate` scores complexity with data |
| Manually decide model per agent | Automatic model recommendation by complexity |
| No design system integration | Figma MCP extracts tokens directly |
| Manual E2E testing | Playwright MCP automates browser tests |
| No library doc access | Context7 MCP provides up-to-date docs |
| Error investigation requires context switching | Sentry MCP surfaces errors in-session |
| PRs reviewed manually | `/pr-reviews` spawns parallel review agents |
| Mobile screens built ad-hoc | `/mobile-screen` generates complete screens |
| Full-stack features require manual layer coordination | `/full-stack` builds bottom-up automatically |
