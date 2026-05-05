import * as React from "react";
import { getDeviceProfile } from "./useDeviceProfile";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Hook that provides reactive breakpoint state using multi-signal detection.
 *
 * Combines viewport width, estimated physical screen size, and aspect ratio
 * to distinguish phones from tablets — no single-width threshold.
 *
 * Correctly identifies:
 * - Galaxy Tab A11 portrait (~719px CSS, 11" screen) → tablet
 * - Galaxy S24 Ultra portrait (360px CSS, 6.8" screen) → phone
 * - Galaxy S24 Ultra landscape (800px CSS, 6.8" screen) → tablet (has the space)
 * - Foldables in the gray zone → decided by screen size estimate
 */
export function useBreakpoint(): BreakpointState {
  const [breakpoint, setBreakpoint] = React.useState<BreakpointState>(() => {
    const profile = getDeviceProfile();
    return {
      isMobile: profile.isPhone,
      isTablet: profile.isTablet,
      isDesktop: profile.isDesktop,
      width: profile.width,
    };
  });

  React.useEffect(() => {
    const handleResize = () => {
      const profile = getDeviceProfile();
      setBreakpoint({
        isMobile: profile.isPhone,
        isTablet: profile.isTablet,
        isDesktop: profile.isDesktop,
        width: profile.width,
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return breakpoint;
}
