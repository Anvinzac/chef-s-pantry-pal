# Requirements: Responsive Tablet Layout

## Requirement 1: Keyboard-Aware Text Fields

### User Story
As a mobile user, I want input fields in the inventory wizard to remain visible when the virtual keyboard appears, so I can see what I'm typing without the keyboard hiding the input.

### Acceptance Criteria
1. When a text input in the IngredientWizard is focused and the virtual keyboard appears, the input field is pushed above the keyboard and remains fully visible.
2. The `useKeyboardVisible` hook detects keyboard presence using the Visual Viewport API and exposes `isKeyboardVisible` (boolean) and `keyboardHeight` (number in pixels).
3. A CSS custom property `--keyboard-inset` is set on `document.documentElement` reflecting the current keyboard height (or `0px` when hidden).
4. When `window.visualViewport` is unavailable (older browsers, desktop), the hook gracefully returns `{ isKeyboardVisible: false, keyboardHeight: 0 }` with no errors.
5. The keyboard height threshold is 100px — differences smaller than this are ignored to avoid false positives from browser chrome changes.

---

## Requirement 2: Responsive Breakpoint Detection

### User Story
As a developer, I want a `useBreakpoint` hook that provides reactive device-class flags (mobile/tablet/desktop), so page components can conditionally render different layouts.

### Acceptance Criteria
1. The `useBreakpoint` hook returns `{ isMobile, isTablet, isDesktop, width }` where exactly one boolean is `true` at any time.
2. Breakpoint boundaries: mobile = `< 768px`, tablet = `≥ 768px and < 1024px`, desktop = `≥ 1024px`.
3. The hook uses `window.matchMedia` listeners and updates state reactively when the viewport crosses a breakpoint boundary.
4. On mobile viewports (< 768px), all existing layouts remain unchanged — no tablet/desktop components are rendered.

---

## Requirement 3: Tablet Inventory Layout

### User Story
As a tablet user, I want to see multiple kitchen spaces at once on the inventory page, so I can get an overview without navigating one space at a time with the knob.

### Acceptance Criteria
1. On viewports ≥ 768px, the inventory page renders a `TabletInventoryGrid` component showing multiple `InventoryTable` instances simultaneously.
2. The grid uses 2 columns on tablet (md: 768–1023px) and 3 columns on desktop (lg: ≥ 1024px).
3. All 9 kitchen spaces from `KITCHEN_SPACES` are rendered in the grid, each with its own independently scrollable table.
4. The knob navigator (`InventoryKnob`) and edge buttons (`InventoryEdgeButtons`) are not rendered on tablet/desktop viewports.
5. The page container expands beyond `max-w-md` on tablet (uses `max-w-5xl` or similar) to utilize available screen width.
6. Each `InventoryTable` in the grid loads and manages its own data independently (no shared loading state).

---

## Requirement 4: Tablet Ordering Layout

### User Story
As a tablet user, I want to see the category list and ingredient grid side by side on the ordering page, so I can browse and order more efficiently without horizontal swiping.

### Acceptance Criteria
1. On viewports ≥ 768px, the ordering page replaces the embla carousel with a two-panel layout: a fixed-width category sidebar (left) and a scrollable ingredient grid (right).
2. The category sidebar displays all categories vertically with their emoji and name, highlighting the active category.
3. The ingredient grid uses 3 columns on tablet and 4 columns on desktop (lg breakpoint).
4. Selecting a category in the sidebar updates the ingredient grid to show that category's items (same behavior as the mobile carousel snap).
5. The page container expands beyond `max-w-md` on tablet to utilize available screen width.
6. The embla carousel is only instantiated on mobile viewports (< 768px) — no carousel overhead on tablet.
7. All existing ordering functionality (quick-add, numpad modal, order bar) continues to work identically on tablet.

---

## Requirement 5: Layout Transition Resilience

### User Story
As a user who may resize their browser or rotate their tablet, I want the app to transition between mobile and tablet layouts without losing my current state or data.

### Acceptance Criteria
1. When the viewport crosses the 768px boundary (e.g., device rotation), the layout switches between mobile and tablet modes without resetting component state (order items, active category, inventory data).
2. The transition does not cause visible content flash or layout shift beyond a single re-render frame.
3. On the ordering page, the active category selection is preserved when switching between carousel (mobile) and sidebar (tablet) layouts.
