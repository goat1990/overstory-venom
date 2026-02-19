---
name: prd-design
description: Process a design-oriented PRD that includes Figma references, wireframes, and visual specs. Extracts design tokens, maps screens to components, generates Overstory specs following atomic design hierarchy (atoms, molecules, organisms, pages). Use when the PRD comes from a design team or includes visual references.
argument-hint: "<path-to-prd>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(wc *), Bash(overstory spec write *), WebFetch
---

# Design PRD Processor

Transform a design-oriented Product Requirements Document into executable component specs and agent commands.

## Input

Read the PRD at: `$ARGUMENTS`

This PRD should contain references to visual designs (Figma URLs, mockup images, wireframes).

## Phase 1: Design Extraction

### Identify visual references
- Figma URLs (figma.com/design/*, figma.com/file/*)
- Image paths (mockups, wireframes, screenshots)
- Design system references (color palettes, typography scales)

### If Figma MCP is available
Use it to extract:
- Frame names and hierarchy
- Design variables (colors, spacing, typography, effects)
- Component instances and variants
- Auto-layout properties (flex direction, gap, padding)
- Responsive breakpoints

### If Figma MCP is NOT available
- Parse any design tokens from the PRD text
- Use image references to infer component structure
- Ask the user for missing design details

### Build the design inventory

```text
| Screen/Frame | Components | States | Breakpoints | Tokens Used |
|-------------|-----------|--------|-------------|-------------|
```

## Phase 2: Design Token Extraction

Extract or infer a design token set:

```json
{
  "colors": {
    "primary": { "50": "#...", "100": "#...", "500": "#...", "900": "#..." },
    "semantic": { "success": "#...", "error": "#...", "warning": "#..." }
  },
  "typography": {
    "heading-1": { "fontFamily": "...", "fontSize": "...", "fontWeight": "...", "lineHeight": "..." },
    "body": { "fontFamily": "...", "fontSize": "...", "fontWeight": "...", "lineHeight": "..." }
  },
  "spacing": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px" },
  "radii": { "sm": "4px", "md": "8px", "lg": "16px", "full": "9999px" },
  "shadows": { "sm": "...", "md": "...", "lg": "..." },
  "breakpoints": { "mobile": "375px", "tablet": "768px", "desktop": "1024px", "wide": "1440px" }
}
```

## Phase 3: Component Decomposition (Atomic Design)

Map each screen to components using atomic design:

### Atoms (smallest, reusable)
- Buttons, inputs, labels, icons, badges, avatars
- No internal state, pure presentational
- Example: `<Button variant="primary" size="md">Submit</Button>`

### Molecules (small groups of atoms)
- Search bars, form fields with labels, card headers
- Minimal internal state
- Example: `<SearchField placeholder="Search..." onSearch={fn} />`

### Organisms (complex, self-contained)
- Navigation bars, hero sections, product cards, data tables
- Own state management, API calls
- Example: `<ProductGrid products={[]} onAddToCart={fn} />`

### Templates/Pages (full layouts)
- Compose organisms into full screens
- Routing, data fetching, layout
- Example: `<DashboardPage />` composing `<Sidebar>`, `<Header>`, `<StatsGrid>`

### Build the component tree

```text
Page: ProductCatalog
  ├── Organism: NavigationBar
  │   ├── Molecule: SearchField
  │   │   ├── Atom: TextInput
  │   │   └── Atom: IconButton (search)
  │   ├── Atom: Logo
  │   └── Molecule: UserMenu
  │       ├── Atom: Avatar
  │       └── Atom: DropdownMenu
  ├── Organism: ProductGrid
  │   └── Molecule: ProductCard (repeated)
  │       ├── Atom: Image
  │       ├── Atom: Badge (sale)
  │       ├── Atom: Text (name, price)
  │       └── Atom: Button (add to cart)
  └── Organism: Pagination
      ├── Atom: Button (prev/next)
      └── Atom: Text (page info)
```

## Phase 4: Component State Analysis

For each organism and molecule, document:

| Component | States | Props | Events | Accessibility |
|-----------|--------|-------|--------|--------------|
| ProductCard | default, hover, loading, error, empty | product, onAddToCart | click, hover | alt text, keyboard nav |
| SearchField | idle, focused, searching, results, no-results | placeholder, onSearch | input, submit, clear | aria-label, role=search |

## Phase 5: Responsive Strategy

For each screen, define behavior across breakpoints:

| Component | Mobile (375px) | Tablet (768px) | Desktop (1024px) |
|-----------|---------------|----------------|-------------------|
| ProductGrid | 1 column, stacked | 2 columns | 3-4 columns |
| NavigationBar | Hamburger menu | Compact icons | Full text + icons |
| Sidebar | Hidden (drawer) | Collapsed | Expanded |

## Phase 6: Task Generation

Generate Overstory tasks following atomic design order:

### Wave 1: Design Tokens + Atoms (parallel, no dependencies)
```text
Task: Setup design tokens (trivial, 1 builder-haiku)
  Files: src/tokens.ts, src/tokens.css

Task: Build atom components (moderate, 1 builder-sonnet per 3-5 atoms)
  Files: src/components/atoms/<name>.tsx, src/components/atoms/<name>.test.tsx
```

### Wave 2: Molecules (depend on atoms)
```text
Task: Build molecule components (moderate, 1 builder per 2-3 molecules)
  Files: src/components/molecules/<name>.tsx, ...
```

### Wave 3: Organisms (depend on molecules)
```text
Task: Build organism components (complex, 1 builder-sonnet each)
  Files: src/components/organisms/<name>.tsx, ...
```

### Wave 4: Pages + Integration (depend on organisms)
```text
Task: Build page layouts (complex, 1 lead + builders)
  Files: src/pages/<name>.tsx, src/routes/...
```

### Wave 5: Testing + Review
```text
Task: E2E testing (1 builder with Playwright)
Task: Design review (1 reviewer comparing implementation vs Figma)
Task: Accessibility audit (1 reviewer checking WCAG compliance)
```

## Phase 7: Mobile Considerations

If the PRD targets mobile (React Native / Expo):

### Platform-specific decisions
- **Shared components**: Which atoms/molecules work on both web and native?
- **Native-only**: Which need platform-specific implementations?
- **Navigation**: React Navigation stack vs tabs vs drawer
- **Gestures**: Swipe, pinch, long-press interactions
- **Offline**: What works without network?

### Generate separate tasks for
- Shared component library (web + native)
- Platform-specific implementations
- Native navigation setup
- Native gesture handlers

## Output Format

### 1. Design Summary
Brief overview of what is being built visually.

### 2. Design Token Set
JSON tokens extracted or inferred.

### 3. Component Tree
ASCII hierarchy of all components.

### 4. Component Inventory Table

```text
| Level | Component | States | Props | Mobile variant? | Complexity |
|-------|-----------|--------|-------|----------------|-----------|
```

### 5. Responsive Matrix
Behavior per breakpoint per component.

### 6. Execution Plan
Phased `overstory sling` commands with atomic design ordering.

### 7. Figma-to-Code Mapping

```text
| Figma Frame | Component | File Path | Status |
|-------------|-----------|-----------|--------|
```

## Guardrails

- NEVER skip the atomic design hierarchy. Build bottom-up, not top-down.
- NEVER assume design tokens. Extract from Figma or ask the user.
- ALWAYS include accessibility requirements per component (WCAG 2.1 AA minimum).
- ALWAYS consider responsive behavior, even if the PRD only shows one breakpoint.
- If Figma access is unavailable, state assumptions clearly and get user confirmation.
- If the design system has existing components, prefer extending over creating new ones.
