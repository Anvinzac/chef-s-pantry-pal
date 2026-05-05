import * as React from "react";

export interface DeviceProfile {
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
  height: number;
}

/**
 * Pure function to compute device profile from current window state.
 *
 * Uses multiple signals to distinguish phones from tablets:
 * - Viewport width (primary)
 * - Estimated physical screen diagonal (screen dimensions × DPR)
 * - Aspect ratio (portrait vs landscape orientation)
 *
 * Classification thresholds:
 * - < 480px viewport → always phone
 * - ≥ 835px viewport → tablet (≥ 1024px → desktop)
 * - 480–834px → uses screen size: portrait + < 7.5" diagonal → phone, else tablet
 */
export function getDeviceProfile(): DeviceProfile {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // Estimate physical screen diagonal in inches
  const dpr = window.devicePixelRatio || 1;
  const physicalWidthPx = screen.width * dpr;
  const physicalHeightPx = screen.height * dpr;
  const diagonalPx = Math.sqrt(
    physicalWidthPx * physicalWidthPx + physicalHeightPx * physicalHeightPx
  );
  // Typical mobile/tablet DPI is 150–400; 200 is a conservative midpoint
  const estimatedDiagonalInches = diagonalPx / 200;

  const aspectRatio = width / height;

  let isPhone = false;
  let isTablet = false;
  let isDesktop = false;

  if (width < 480) {
    isPhone = true;
  } else if (width >= 835) {
    if (width >= 1024) {
      isDesktop = true;
    } else {
      isTablet = true;
    }
  } else {
    // 480–834px gray zone: use screen size + orientation
    if (aspectRatio < 1 && estimatedDiagonalInches < 7.5) {
      isPhone = true;
    } else {
      isTablet = true;
    }
  }

  return {
    isPhone,
    isTablet,
    isDesktop,
    isTouch: isTouch || isCoarsePointer,
    width,
    height,
  };
}

/**
 * Hook that provides reactive device profile using multi-signal detection.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = React.useState<DeviceProfile>(() => {
    return getDeviceProfile();
  });

  React.useEffect(() => {
    const handleResize = () => {
      setProfile(getDeviceProfile());
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

  return profile;
}

/**
 * Convenience hook: returns true only for phones.
 * Replaces the old single-threshold useIsMobile.
 */
export function useIsMobile() {
  const profile = useDeviceProfile();
  return profile.isPhone;
}
