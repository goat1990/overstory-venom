---
name: mobile-screen
description: Build a complete mobile screen with navigation integration, state management, offline support, and native gestures. Supports React Native, Expo, and cross-platform patterns. Use when implementing a new mobile screen or converting a web component to mobile.
argument-hint: "<screen-name-or-spec>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx *), Bash(bun *), Bash(bunx *)
---

# Mobile Screen Builder

Build a production-ready mobile screen with all the layers: UI, navigation, state, gestures, offline, and tests.

## Input

`$ARGUMENTS`: Screen name, spec path, or Figma reference.

## Step 1: Project Analysis

### Detect mobile framework
```
# Expo
Glob: app.json, app.config.js, app.config.ts -> check for "expo"
Grep: "expo" in package.json dependencies

# Bare React Native
Grep: "react-native" in package.json (without expo)
Glob: android/, ios/

# Cross-platform (shared with web)
Glob: **/shared/**, **/common/**
Grep: "Platform.OS\|Platform.select" in *.tsx
```

### Detect navigation
```
# React Navigation
Grep: "@react-navigation" in package.json
Glob: **/navigation/**/*.tsx, **/navigators/**/*.tsx

# Expo Router
Glob: app/(tabs)/, app/_layout.tsx
Grep: "expo-router" in package.json
```

### Detect styling approach
```
# StyleSheet (vanilla)
Grep: "StyleSheet.create" in *.tsx

# Styled Components / NativeWind / Tamagui
Grep: "nativewind\|tamagui\|styled-components.*native" in package.json

# Theme system
Glob: **/theme/**/*.ts, **/tokens/**/*.ts
```

### Detect state management
```
Grep: "zustand\|redux\|jotai\|mobx\|tanstack.*query" in package.json
```

## Step 2: Screen Architecture

Based on the screen requirements, plan:

### Layout
```
SafeAreaView
  ├── Header (title, back button, actions)
  ├── ScrollView / FlatList / SectionList
  │   └── Content components
  ├── FloatingAction (if needed)
  └── BottomSheet (if needed)
```

### States to handle
- **Loading**: Skeleton or activity indicator
- **Empty**: Illustration + message + CTA
- **Error**: Error message + retry button
- **Populated**: Normal content display
- **Refreshing**: Pull-to-refresh indicator
- **Offline**: Cached data indicator + sync status

### Navigation integration
- Screen registration in navigator
- Route params typing
- Deep link configuration
- Header configuration
- Transition animations

## Step 3: Implementation

### 3a. Types and interfaces

```typescript
// types.ts
interface ScreenParams {
  // Route params for this screen
}

interface ScreenState {
  // Local state
}
```

### 3b. Screen component

Follow the project's existing screen pattern. Typical structure:

```typescript
// <ScreenName>Screen.tsx
export function ScreenNameScreen() {
  // 1. Route params
  // 2. Hooks (data fetching, state, navigation)
  // 3. Handlers
  // 4. Render with state branching (loading/error/empty/data)
}
```

### 3c. Sub-components

Extract reusable pieces into the screen's directory:

```
screens/
  ScreenName/
    index.tsx                 # Screen export
    ScreenNameScreen.tsx      # Main screen component
    components/
      ScreenNameHeader.tsx    # Screen-specific header
      ScreenNameList.tsx      # List component
      ScreenNameCard.tsx      # Card/item component
    hooks/
      useScreenNameData.ts    # Data fetching hook
    types.ts                  # Screen-specific types
    __tests__/
      ScreenNameScreen.test.tsx
```

### 3d. Navigation registration

```typescript
// In the appropriate navigator file
// Add screen to stack/tab/drawer navigator
// Configure header, transitions, deep links
```

### 3e. Gesture handling (if needed)

```typescript
// Common gestures:
// - Swipe to delete (Swipeable from react-native-gesture-handler)
// - Pull to refresh (RefreshControl)
// - Swipe between tabs (TabView)
// - Long press actions (contextual menu)
// - Pinch to zoom (for images/maps)
```

### 3f. Offline support (if needed)

```typescript
// Offline strategy:
// 1. Cache API responses (AsyncStorage, MMKV, or SQLite)
// 2. Optimistic updates for mutations
// 3. Queue failed mutations for retry
// 4. Show sync status indicator
// 5. NetInfo listener for connectivity changes
```

## Step 4: Platform-Specific Handling

Check if the screen needs different behavior per platform:

```typescript
import { Platform } from 'react-native';

// Platform-specific styles
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
});
```

## Step 5: Accessibility

For every interactive element:

- [ ] `accessibilityLabel` on touchable elements
- [ ] `accessibilityRole` set correctly (button, link, header, image, etc.)
- [ ] `accessibilityState` for toggles/checkboxes ({ checked, disabled, selected })
- [ ] `accessibilityHint` for non-obvious actions
- [ ] `accessible={true}` to group related elements
- [ ] Text scales with system font size (no fixed font sizes without `allowFontScaling`)
- [ ] Touch targets >= 44x44pt
- [ ] VoiceOver/TalkBack navigation order makes sense

## Step 6: Performance

- [ ] Use `FlatList`/`SectionList` for long lists (never ScrollView with map)
- [ ] `React.memo` for list items that receive stable props
- [ ] `useCallback` for event handlers passed to list items
- [ ] Images optimized (correct size, progressive loading, cache)
- [ ] Animations use `useNativeDriver: true` or Reanimated
- [ ] No inline object/array creation in render

## Step 7: Testing

### Unit tests
```typescript
// Test rendering in all states
describe('ScreenNameScreen', () => {
  it('renders loading state');
  it('renders empty state');
  it('renders error state with retry');
  it('renders populated state');
  it('handles pull to refresh');
  it('navigates on item press');
});
```

### Snapshot tests (optional, based on project convention)
```typescript
it('matches snapshot in default state');
```

### Integration tests
```typescript
it('fetches data on mount');
it('retries on error');
it('navigates back correctly');
```

## Output

Present:
1. Files created (with full paths)
2. Navigation changes (which navigator was updated)
3. Screen states implemented (loading, error, empty, data)
4. Gestures configured
5. Accessibility compliance notes
6. Performance considerations applied
7. Test coverage summary

## Guardrails

- ALWAYS use the project's existing navigation library. Do not mix navigators.
- ALWAYS handle all screen states (loading, error, empty, data).
- NEVER use inline styles for anything reused. Use StyleSheet.create or the project's styling system.
- NEVER import from `react-native` if the project uses a UI library (Tamagui, NativeWind, etc.). Use the library's components.
- ALWAYS test with both iOS and Android in mind (Platform.OS checks where needed).
- ALWAYS handle safe areas (notch, home indicator, status bar).
- If the screen needs data, create a custom hook. Never fetch in the component body.
- Prefer composition: break screens into small, testable components.
