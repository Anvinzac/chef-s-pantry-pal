import { useDeviceProfile } from "./useDeviceProfile";

/**
 * Returns true only for phones (not tablets).
 * Uses multi-signal detection instead of a single width threshold.
 */
export function useIsMobile() {
  const profile = useDeviceProfile();
  return profile.isPhone;
}
