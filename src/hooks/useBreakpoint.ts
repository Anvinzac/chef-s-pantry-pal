import * as React from "react";

export interface BreakpointState {
  isMobile: boolean;   // < 768px
  isTablet: boolean;   // >= 768px && < 1024px
  isDesktop: boolean;  // >= 1024px
  width: number;
}

const BREAKPOINTS = {
  md: 768,   // tablet starts here
  lg: 1024,  // desktop starts here
} as const;

/**
 * Hook that provides reactive breakpoint state for responsive layouts.
 * Returns exactly one of isMobile, isTablet, or isDesktop as true at any time.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */
export function useBreakpoint(): BreakpointState {
  const [breakpoint, setBreakpoint] = React.useState<BreakpointState>(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    return getBreakpointState(width);
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoint(getBreakpointState(width));
    };

    // Set up matchMedia listeners for breakpoint boundaries
    const mdQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`);
    const lgQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`);

    const onChange = () => {
      handleResize();
    };

    mdQuery.addEventListener("change", onChange);
    lgQuery.addEventListener("change", onChange);

    // Initial state
    handleResize();

    return () => {
      mdQuery.removeEventListener("change", onChange);
      lgQuery.removeEventListener("change", onChange);
    };
  }, []);

  return breakpoint;
}

/**
 * Pure function to determine breakpoint state from viewport width.
 * Ensures exactly one layout mode is active at any time.
 */
export function getBreakpointState(width: number): BreakpointState {
  if (width >= BREAKPOINTS.lg) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width,
    };
  }

  if (width >= BREAKPOINTS.md) {
    return {
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      width,
    };
  }

  return {
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    width,
  };
}
