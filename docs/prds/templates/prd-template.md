# PRD: [Feature Name]

> Process this PRD with `/prd docs/prds/<this-file>.md`

## Meta

| Field | Value |
|-------|-------|
| **Author** | |
| **Date** | YYYY-MM-DD |
| **Status** | draft / review / approved / in-progress / done |
| **Priority** | P0 (critical) / P1 (high) / P2 (medium) / P3 (low) |
| **Target release** | vX.Y.Z or sprint name |
| **Estimated complexity** | trivial / moderate / complex / epic |

## Problem Statement

What problem does this solve? Why now? What happens if we don't build it?

## Target Users

| User type | Need | Current workaround |
|-----------|------|--------------------|
| | | |

## Proposed Solution

High-level description of what will be built. Keep it to 3-5 paragraphs max. Include a diagram if the flow is complex.

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| RF-01 | | Must | |
| RF-02 | | Must | |
| RF-03 | | Should | |
| RF-04 | | Could | |

### MoSCoW Priority Key
- **Must**: Required for launch. Feature is broken without it.
- **Should**: Important but can ship without. Next iteration.
- **Could**: Nice to have. Low effort to include.
- **Won't**: Explicitly excluded from this PRD.

## Non-Functional Requirements

### Performance
- Page load time: < Xs
- API response time: < Xms (p95)
- Bundle size impact: < X KB

### Security
- Authentication: required / public
- Authorization: role-based / resource-based / none
- Data sensitivity: PII / financial / public

### Accessibility
- WCAG level: AA (minimum) / AAA
- Screen reader support: required
- Keyboard navigation: required

### Mobile
- Platform: iOS / Android / both
- Min OS version: iOS X / Android X
- Offline support: required / not needed

## User Stories

### Story 1: [Title]
**As a** [user type], **I want to** [action], **so that** [benefit].

**Acceptance criteria:**
- [ ] AC-01: Given [context], when [action], then [result]
- [ ] AC-02: Given [context], when [action], then [result]

### Story 2: [Title]
**As a** [user type], **I want to** [action], **so that** [benefit].

**Acceptance criteria:**
- [ ] AC-03: Given [context], when [action], then [result]
- [ ] AC-04: Given [context], when [action], then [result]

## Technical Design

### Data Model

```
Entity: [Name]
  - id: UUID (PK)
  - field_1: type
  - field_2: type
  - created_at: timestamp
  - updated_at: timestamp

Relationships:
  - [Name] has many [Other]
  - [Name] belongs to [Other]
```

### API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/v1/... | | Yes |
| POST | /api/v1/... | | Yes |
| PUT | /api/v1/... | | Yes |
| DELETE | /api/v1/... | | Yes |

### Frontend Components

List the main components needed (detail comes from `/prd-design` if design-heavy).

| Component | Type | New/Modify | Notes |
|-----------|------|-----------|-------|
| | Page | New | |
| | Organism | Modify | |
| | Molecule | New | |

## Design

- **Figma**: [URL to designs]
- **Wireframes**: [URL or path]
- **Design tokens**: [reference to design system]
- **Prototype**: [URL to interactive prototype]

> If this PRD has significant design work, process it with `/prd-design` instead.

## Dependencies

### External
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| | API | Available | Low |
| | Package | Evaluate | Medium |
| | Service | Not started | High |

### Internal
| Dependency | Owner | Status |
|-----------|-------|--------|
| | Team/person | |

## Out of Scope

Explicitly list what is NOT included in this PRD to prevent scope creep:

- NOT: ...
- NOT: ...
- NOT: ...

## Risks and Mitigations

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | | Low/Med/High | Low/Med/High | |
| R2 | | Low/Med/High | Low/Med/High | |

## Success Metrics

How do we know this feature succeeded after launch?

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| | | | |

## Rollout Plan

1. **Phase 1**: Internal testing (team only)
2. **Phase 2**: Beta (X% of users)
3. **Phase 3**: GA (all users)

### Feature flags
- Flag name: `feature_<name>`
- Rollout strategy: percentage / allow-list / environment

### Rollback plan
How to revert if something goes wrong.

## Open Questions

| # | Question | Owner | Due date | Resolution |
|---|----------|-------|----------|------------|
| Q1 | | | | |
| Q2 | | | | |

---

## Processing Notes

_This section is filled by `/prd` after processing:_

- **Complexity score**: _pending_
- **Agent strategy**: _pending_
- **Estimated cost**: _pending_
- **Execution plan**: _pending_
