# Design PRD: [Feature Name]

> Process this PRD with `/prd-design docs/prds/<this-file>.md`

## Meta

| Field | Value |
|-------|-------|
| **Author** | |
| **Designer** | |
| **Date** | YYYY-MM-DD |
| **Status** | draft / review / approved / in-progress / done |
| **Priority** | P0 / P1 / P2 / P3 |
| **Platform** | Web / iOS / Android / Cross-platform |

## Design References

### Figma Links

| Screen/Flow | Figma URL | Status |
|------------|-----------|--------|
| Main screen | `https://figma.com/design/...` | Final |
| Empty state | `https://figma.com/design/...` | Final |
| Loading state | `https://figma.com/design/...` | Final |
| Error state | `https://figma.com/design/...` | Draft |
| Mobile variant | `https://figma.com/design/...` | Final |

### Prototype
- Interactive prototype: [Figma prototype URL]
- User flow diagram: [URL or path]

### Mockups (if no Figma)
- Desktop: `docs/prds/assets/<name>-desktop.png`
- Mobile: `docs/prds/assets/<name>-mobile.png`
- Tablet: `docs/prds/assets/<name>-tablet.png`

## Design System

### Tokens to Use (from existing system)
Reference existing design tokens. If new tokens are needed, list them below.

### New Tokens Required

```yaml
colors:
  # New colors not in the existing system
  feature-primary: "#XXXXXX"
  feature-secondary: "#XXXXXX"

spacing:
  # New spacing values if needed

typography:
  # New text styles if needed
```

### Icons
| Icon | Source | Name/ID | Notes |
|------|--------|---------|-------|
| | Figma / Icon library | | |

### Illustrations / Assets
| Asset | Source | Format | Notes |
|-------|--------|--------|-------|
| | Figma / Lottie / SVG | | |

## Screen Inventory

### Screen 1: [Name]

**Purpose**: What this screen does.

**Entry points**: How users get here (navigation, deep link, notification).

**States**:
| State | Description | Figma frame |
|-------|-------------|-------------|
| Default | Normal populated view | [link] |
| Loading | Skeleton or spinner | [link] |
| Empty | No data yet | [link] |
| Error | Something went wrong | [link] |
| Offline | No network | [link] |

**Interactions**:
| Element | Gesture | Action | Animation |
|---------|---------|--------|-----------|
| Card | Tap | Navigate to detail | Shared element transition |
| Card | Long press | Show context menu | Scale + haptic |
| List | Pull down | Refresh data | Spring bounce |
| Item | Swipe left | Delete | Slide + fade |
| FAB | Tap | Create new | Expand morph |

**Responsive behavior**:
| Breakpoint | Layout change |
|-----------|--------------|
| Mobile (<768px) | Single column, bottom sheet navigation |
| Tablet (768-1024px) | Two column, sidebar navigation |
| Desktop (>1024px) | Three column, persistent sidebar |

### Screen 2: [Name]
_(Repeat the same structure)_

## Component Hierarchy

Map each screen to its component tree (atomic design):

```
Screen: [Name]
  ├── Organism: [Name]
  │   ├── Molecule: [Name]
  │   │   ├── Atom: [Name] (existing / new)
  │   │   └── Atom: [Name] (existing / new)
  │   └── Molecule: [Name]
  ├── Organism: [Name]
  │   └── ...
  └── Organism: [Name]
```

### New Components Needed

| Component | Level | Platform | States | Priority |
|-----------|-------|----------|--------|----------|
| | Atom | Both | 3 | Must |
| | Molecule | Both | 4 | Must |
| | Organism | Web only | 5 | Should |

### Existing Components to Modify

| Component | Current path | Modification | Risk |
|-----------|-------------|-------------|------|
| | `src/components/...` | Add variant | Low |
| | `src/components/...` | Extend props | Medium |

## Animation Specifications

| Animation | Trigger | Duration | Easing | Library |
|-----------|---------|----------|--------|---------|
| Page transition | Navigation | 300ms | ease-in-out | React Navigation |
| Card expand | Tap | 250ms | spring(1, 80, 12) | Reanimated |
| Skeleton pulse | On mount | 1500ms | linear (loop) | Reanimated |
| Fade in | Data load | 200ms | ease-out | Animated API |

## Accessibility Requirements

| Requirement | Screens | Priority |
|------------|---------|----------|
| Color contrast AA (4.5:1 text, 3:1 large) | All | Must |
| Screen reader labels | All interactive | Must |
| Focus order | Forms, navigation | Must |
| Reduce motion support | Animations | Should |
| Dynamic type / font scaling | All text | Must |
| Touch target 44x44pt minimum | All buttons | Must |
| High contrast mode | All | Could |

## Functional Requirements

| ID | Requirement | Related screen | Priority |
|----|-------------|---------------|----------|
| RF-01 | | Screen 1 | Must |
| RF-02 | | Screen 1, 2 | Must |
| RF-03 | | Screen 2 | Should |

## Acceptance Criteria

- [ ] AC-01: [Screen] renders matching Figma design within 2px tolerance
- [ ] AC-02: All interactive states (hover, press, focus, disabled) match design
- [ ] AC-03: Responsive layout works at all specified breakpoints
- [ ] AC-04: Animations are smooth (60fps) and respect reduce-motion
- [ ] AC-05: Screen reader navigation is logical and complete
- [ ] AC-06: All new components have Storybook stories (if project uses Storybook)
- [ ] AC-07: Component tests cover all states
- [ ] AC-08: Design tokens used consistently (no hardcoded values)

## Out of Scope

- NOT: ...
- NOT: ...

## Open Design Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| DQ-1 | | Designer | Open |
| DQ-2 | | Designer | Resolved: [answer] |

---

## Processing Notes

_This section is filled by `/prd-design` after processing:_

- **Components identified**: _pending_
- **Design tokens extracted**: _pending_
- **Atomic design waves**: _pending_
- **Execution plan**: _pending_
