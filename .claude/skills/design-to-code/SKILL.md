---
name: design-to-code
description: Convert Figma designs or visual mockups into production-ready React and React Native components. Extracts design tokens, generates component code with proper typing, styling, accessibility, and tests. Use when implementing UI from design specs or Figma frames.
argument-hint: "<figma-url-or-component-name>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx *), Bash(bun test:*), Bash(bunx biome:*), WebFetch
---

# Design to Code

Convert visual designs into production-ready components.

## Input

`$ARGUMENTS` can be:
- A Figma URL (frame or component)
- A component name to implement (will search for design reference)
- A path to a mockup image

## Step 1: Design Data Collection

### If Figma MCP is available
Extract directly:
- Frame dimensions and auto-layout
- Colors, typography, spacing (as design variables)
- Component variants and states
- Assets (icons, images)

### If Figma URL but no MCP
Use WebFetch on the Figma embed URL to gather what is available, then ask the user for:
- Design token values (colors, fonts, spacing)
- Component states (hover, active, disabled, loading, error)
- Responsive behavior

### If mockup image
Read the image and infer:
- Layout structure (flex, grid)
- Approximate colors and spacing
- Component hierarchy
- Ask user to confirm assumptions

## Step 2: Determine Target Platform

Check the existing project for:
```
# React (Web)
Glob: **/package.json -> look for "react-dom"
Glob: **/*.tsx -> check for DOM elements (div, span, button)

# React Native
Glob: **/package.json -> look for "react-native"
Glob: **/*.tsx -> check for View, Text, TouchableOpacity

# Both (cross-platform)
Look for shared component libraries
```

## Step 3: Discover Existing Patterns

Before writing any code, understand the project's conventions:

```
# Styling approach
Glob: **/*.css, **/*.scss, **/*.module.css -> CSS Modules
Grep: "styled\." or "css\`" -> styled-components/emotion
Grep: "className.*=" -> Tailwind or utility classes
Grep: "StyleSheet.create" -> React Native StyleSheet

# Component patterns
Glob: **/components/**/*.tsx -> file organization
Read a few existing components to understand:
  - Export style (default vs named)
  - Props pattern (interface vs type, destructured vs object)
  - State management (useState, useReducer, zustand, etc.)
  - Test patterns (testing-library, enzyme, etc.)
```

## Step 4: Generate Design Tokens

If the project doesn't have tokens yet, create them:

```typescript
// tokens.ts
export const colors = {
  primary: { 50: '#...', 500: '#...', 900: '#...' },
  neutral: { 50: '#...', 500: '#...', 900: '#...' },
  semantic: { success: '#...', error: '#...', warning: '#...', info: '#...' },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
} as const;

export const radii = {
  sm: 4, md: 8, lg: 16, full: 9999,
} as const;
```

If tokens already exist, use them. Do NOT create duplicates.

## Step 5: Component Generation

For each component, generate:

### Component file (`ComponentName.tsx`)
```typescript
// Follow project conventions discovered in Step 3
// Include:
// - Proper TypeScript props interface
// - All states (default, hover, active, disabled, loading, error, empty)
// - Accessibility attributes (aria-label, role, tabIndex)
// - Responsive behavior
// - Design tokens (not hardcoded values)
```

### Test file (`ComponentName.test.tsx`)
```typescript
// Include:
// - Renders correctly (snapshot or structural)
// - All interactive states work
// - Accessibility checks (if testing-library: screen.getByRole)
// - Edge cases (empty data, long text, missing props)
```

### Story file (`ComponentName.stories.tsx`) -- if Storybook exists
```typescript
// Include:
// - Default story
// - All variants
// - All states (loading, error, empty)
// - Interactive controls for props
```

## Step 6: Accessibility Checklist

For every component, verify:

- [ ] Color contrast ratio >= 4.5:1 (AA) for text
- [ ] Interactive elements have focus indicators
- [ ] Images have alt text
- [ ] Form inputs have labels (visible or aria-label)
- [ ] Touch targets >= 44x44px on mobile
- [ ] Screen reader announces state changes
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No information conveyed by color alone

## Step 7: Responsive Implementation

Generate responsive styles for:

| Breakpoint | Target | Approach |
|-----------|--------|----------|
| < 375px | Small mobile | Stack everything, full-width |
| 375-768px | Mobile | Single column, compact spacing |
| 768-1024px | Tablet | 2-column where appropriate |
| > 1024px | Desktop | Full layout |

For React Native, use `Dimensions` API or `useWindowDimensions` hook.

## Step 8: Quality Verification

Run project quality gates:
```bash
# Type check
bunx tsc --noEmit

# Lint and format
bunx biome check --write .

# Tests
bun test <component-test-file>
```

## Output

Present:
1. Generated files list with paths
2. Design tokens used (or created)
3. Accessibility compliance notes
4. Responsive behavior summary
5. Any assumptions made (flag for designer review)

## Guardrails

- NEVER hardcode colors, spacing, or font sizes. Always use tokens.
- NEVER skip accessibility. Every interactive element needs keyboard and screen reader support.
- ALWAYS match existing project conventions (styling, exports, testing patterns).
- ALWAYS handle component states: default, hover/press, focus, disabled, loading, error, empty.
- If you cannot determine a design value, use a placeholder token and flag it for review.
- Prefer composition over inheritance. Small, focused components.
