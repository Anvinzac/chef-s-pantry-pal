import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { getBreakpointState } from "./useBreakpoint";

describe("useBreakpoint - Layout Selection Logic", () => {
  describe("Unit Tests", () => {
    it("should return mobile state for width < 768px", () => {
      const state = getBreakpointState(767);
      expect(state.isMobile).toBe(true);
      expect(state.isTablet).toBe(false);
      expect(state.isDesktop).toBe(false);
    });

    it("should return tablet state for width >= 768px and < 1024px", () => {
      const state = getBreakpointState(768);
      expect(state.isMobile).toBe(false);
      expect(state.isTablet).toBe(true);
      expect(state.isDesktop).toBe(false);

      const state2 = getBreakpointState(1023);
      expect(state2.isMobile).toBe(false);
      expect(state2.isTablet).toBe(true);
      expect(state2.isDesktop).toBe(false);
    });

    it("should return desktop state for width >= 1024px", () => {
      const state = getBreakpointState(1024);
      expect(state.isMobile).toBe(false);
      expect(state.isTablet).toBe(false);
      expect(state.isDesktop).toBe(true);
    });

    it("should include width in returned state", () => {
      const state = getBreakpointState(800);
      expect(state.width).toBe(800);
    });
  });

  describe("Property 1: Exactly one layout mode is active for any viewport width", () => {
    it("should satisfy the property for all positive widths", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10000 }), (width) => {
          const state = getBreakpointState(width);
          const activeCount =
            (state.isMobile ? 1 : 0) +
            (state.isTablet ? 1 : 0) +
            (state.isDesktop ? 1 : 0);
          return activeCount === 1;
        })
      );
    });

    it("should have correct boundaries", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 767 }),
          (width) => {
            const state = getBreakpointState(width);
            return state.isMobile === true;
          }
        ),
        { numRuns: 100 }
      );

      fc.assert(
        fc.property(
          fc.integer({ min: 768, max: 1023 }),
          (width) => {
            const state = getBreakpointState(width);
            return state.isTablet === true;
          }
        ),
        { numRuns: 100 }
      );

      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 10000 }),
          (width) => {
            const state = getBreakpointState(width);
            return state.isDesktop === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
