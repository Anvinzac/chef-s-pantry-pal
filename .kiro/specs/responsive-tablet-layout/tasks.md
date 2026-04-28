# Implementation Plan: Responsive Tablet Layout

## Overview

Add keyboard-aware input fields and responsive tablet/desktop layouts to the kitchen management app. The existing mobile experience (`max-w-md`, knob navigation, embla carousel) remains unchanged. On wider viewports (≥ 768px), the inventory page shows a multi-space grid and the ordering page shows a sidebar + grid layout. Two new hooks (`useBreakpoint`, `useKeyboardVisible`) provide the reactive state for layout decisions.

## Tasks

- [x] 1. Create responsive hooks and utility constants
  - [x] 1.1 Create `useKeyboardVisible` hook at `src/hooks/useKeyboardVisible.ts`
    - Implement Visual Viewport API listener to detect virtual keyboard presence
    - Calculate keyboard height as `window.innerHeight - visualViewport.height` with a 100px threshold
    - Set CSS custom property `--keyboard-inset` on `document.documentElement`
    - Gracefully return `{ isKeyboardVisible: false, keyboardHeight: 0 }` when `window.visualViewport` is unavailable
    - Clean up event listeners on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Create `useBreakpoint` hook at `src/hooks/useBreakpoint.ts`
    - Use `window.matchMedia` listeners for `(min-width: 768px)` and `(min-width: 1024px)` breakpoints
    - Return `{ isMobile, isTablet, isDesktop, width }` where exactly one boolean is true at any time
    - Boundaries: mobile `< 768px`, tablet `≥ 768px and < 1024px`, desktop `≥ 1024px`
    - Update state reactively when viewport crosses a breakpoint boundary
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Write property tests for `useBreakpoint` layout selection logic
    - **Property 1: Exactly one layout mode is active for any viewport width**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 1.4 Write property tests for `useKeyboardVisible` keyboard height calculation
    - **Property 2: When `visualViewport.height < window.innerHeight - 100`, `isKeyboardVisible === true` and `keyboardHeight > 0`**
    - **Validates: Requirements 1.2, 1.5**

- [x] 2. Checkpoint - Ensure hooks compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create `TabletInventoryGrid` component
  - [x] 3.1 Create `TabletInventoryGrid` component at `src/components/inventory/TabletInventoryGrid.tsx`
    - Accept `spaces` prop typed as `KitchenSpace[]` from `KITCHEN_SPACES`
    - Render a responsive CSS grid: 2 columns on `md` (768–1023px), 3 columns on `lg` (≥ 1024px) using Tailwind `grid-cols-2 lg:grid-cols-3`
    - Render an `InventoryTable` instance for each of the 9 kitchen spaces
    - Each grid cell should be independently scrollable with a fixed height
    - Each `InventoryTable` loads and manages its own data independently
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 3.2 Write unit tests for `TabletInventoryGrid`
    - Verify all 9 kitchen spaces are rendered
    - Verify grid column classes are applied correctly
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Integrate tablet layout into `Inventory.tsx`
  - [x] 4.1 Modify `src/pages/Inventory.tsx` to use `useBreakpoint` for conditional rendering
    - Import `useBreakpoint` and `TabletInventoryGrid`
    - On mobile (`isMobile`): render existing knob-driven layout unchanged
    - On tablet/desktop (`!isMobile`): render `TabletInventoryGrid` with all `KITCHEN_SPACES`
    - Hide `InventoryKnob` and `InventoryEdgeButtons` on tablet/desktop viewports
    - Expand page container from `max-w-md` to `max-w-5xl` on tablet/desktop
    - _Requirements: 3.1, 3.4, 3.5, 2.4_

  - [x] 4.2 Write unit tests for Inventory page layout switching
    - Verify knob/edge buttons are not rendered at ≥ 768px
    - Verify `TabletInventoryGrid` is rendered at ≥ 768px
    - Verify existing mobile layout is unchanged at < 768px
    - **Property 4: On tablet viewport (w ≥ 768), multiple InventoryTable instances are rendered simultaneously**
    - **Property 5: On mobile viewport (w < 768), knob navigation is active and no tablet components render**
    - **Validates: Requirements 3.1, 3.4, 2.4**

- [x] 5. Checkpoint - Ensure inventory tablet layout works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create `TabletOrderingLayout` component
  - [x] 6.1 Create `TabletOrderingLayout` component at `src/components/chef/TabletOrderingLayout.tsx`
    - Accept props: `categories`, `activeCategory`, `onCategorySelect`, `alertCounts`, `children`
    - Render a two-panel flex layout: fixed-width category sidebar (~200px, left) and scrollable ingredient content area (right)
    - Category sidebar displays all categories vertically with emoji, name, and alert count badge
    - Highlight the active category in the sidebar
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Write unit tests for `TabletOrderingLayout`
    - Verify sidebar renders all categories
    - Verify active category is highlighted
    - Verify children are rendered in the main content area
    - _Requirements: 4.1, 4.2_

- [x] 7. Integrate tablet layout into `Index.tsx` (ordering page)
  - [x] 7.1 Modify `src/pages/Index.tsx` to use `useBreakpoint` for conditional rendering
    - Import `useBreakpoint` and `TabletOrderingLayout`
    - On mobile (`isMobile`): render existing embla carousel layout unchanged
    - On tablet/desktop (`!isMobile`): render `TabletOrderingLayout` with category sidebar and ingredient grid
    - Ingredient grid uses `grid-cols-3 lg:grid-cols-4` on tablet/desktop
    - Only instantiate embla carousel on mobile viewports — no carousel overhead on tablet
    - Expand page container from `max-w-md` to `max-w-5xl` on tablet/desktop
    - Preserve active category selection when switching between carousel and sidebar layouts
    - All existing ordering functionality (quick-add, numpad modal, order bar) must continue to work
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.3_

  - [x] 7.2 Write unit tests for ordering page layout switching
    - Verify embla carousel is present at < 768px and absent at ≥ 768px
    - Verify category sidebar is present at ≥ 768px
    - Verify active category is preserved across layout transitions
    - _Requirements: 4.6, 5.1, 5.3_

- [x] 8. Checkpoint - Ensure ordering tablet layout works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Keyboard-aware input fix for `IngredientWizard`
  - [x] 9.1 Modify `src/components/inventory/IngredientWizard.tsx` to use `useKeyboardVisible`
    - Import `useKeyboardVisible` hook
    - Apply dynamic `paddingBottom` to the bottom search bar container when keyboard is visible, using `keyboardHeight` from the hook
    - Ensure the quantity input in the inline form also scrolls into view when keyboard appears
    - Add `transition-[padding] duration-200` for smooth animation
    - _Requirements: 1.1, 1.3_

  - [x] 9.2 Write unit tests for keyboard-aware behavior in IngredientWizard
    - Verify padding is applied when keyboard is visible
    - Verify no padding when keyboard is hidden
    - **Property 3: When keyboard is visible, input bottom edge is above keyboard top edge**
    - **Validates: Requirements 1.1, 1.3**

- [x] 10. CSS and Tailwind responsive utilities
  - [x] 10.1 Add responsive CSS custom properties and utility classes to `src/index.css`
    - Add `--keyboard-inset: 0px` default to `:root`
    - Add any additional responsive utility classes needed for tablet grid spacing
    - _Requirements: 1.3_

- [x] 11. Layout transition resilience
  - [x] 11.1 Write integration tests for layout transition resilience
    - Verify viewport crossing 768px boundary does not reset order items or active category
    - Verify no visible content flash during layout transition
    - **Property 6: Layout transitions between mobile ↔ tablet are seamless with no state reset**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript/React — all implementations use this stack
- Existing mobile layouts remain completely unchanged; tablet components are additive only
