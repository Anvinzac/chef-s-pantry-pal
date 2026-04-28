import * as React from "react";

/**
 * Pure function to calculate keyboard height from window and viewport heights.
 * Returns 0 if difference is <= 100px (threshold to avoid false positives).
 */
export function calculateKeyboardHeight(
  windowHeight: number,
  viewportHeight: number
): number {
  const diff = windowHeight - viewportHeight;
  return diff > 100 ? diff : 0;
}

export interface KeyboardState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

/**
 * Hook that detects virtual keyboard presence using the Visual Viewport API.
 * Sets CSS custom property --keyboard-inset on document root.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function useKeyboardVisible(): KeyboardState {
  const [keyboardState, setKeyboardState] = React.useState<KeyboardState>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
  });

  React.useEffect(() => {
    // Gracefully handle missing visualViewport API
    if (!window.visualViewport) {
      return;
    }

    const handleViewportResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const height = calculateKeyboardHeight(window.innerHeight, viewport.height);
      const isVisible = height > 0;

      setKeyboardState({
        isKeyboardVisible: isVisible,
        keyboardHeight: height,
      });

      // Set CSS custom property for use in styles
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${height}px`
      );
    };

    // Initial calculation
    handleViewportResize();

    // Listen to visualViewport resize events
    window.visualViewport.addEventListener("resize", handleViewportResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
      // Clean up CSS variable on unmount
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return keyboardState;
}
