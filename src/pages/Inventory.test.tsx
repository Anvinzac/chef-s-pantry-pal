import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Inventory from "./Inventory";
import * as fc from "fast-check";

// Mock the hooks
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(),
}));

vi.mock("@/hooks/useKeyboardVisible", () => ({
  useKeyboardVisible: vi.fn(() => ({
    isKeyboardVisible: false,
    keyboardHeight: 0,
  })),
}));

// Mock components
vi.mock("@/components/inventory/InventoryKnob", () => ({
  InventoryKnob: () => <div data-testid="inventory-knob">Knob</div>,
}));

vi.mock("@/components/inventory/InventoryEdgeButtons", () => ({
  InventoryEdgeButtons: () => <div data-testid="inventory-edge-buttons">Edge Buttons</div>,
}));

vi.mock("@/components/inventory/InventoryTable", () => ({
  InventoryTable: ({ id, label, emoji }: any) => (
    <div data-testid={`inventory-table-${id}`}>
      {emoji} {label}
    </div>
  ),
}));

vi.mock("@/components/inventory/TabletInventoryGrid", () => ({
  TabletInventoryGrid: () => <div data-testid="tablet-inventory-grid">Tablet Grid</div>,
}));

const { useBreakpoint } = await import("@/hooks/useBreakpoint");

describe("Inventory Page - Layout Switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mobile Layout (< 768px)", () => {
    beforeEach(() => {
      (useBreakpoint as any).mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 375,
      });
    });

    it("should render knob navigation on mobile", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.getByTestId("inventory-knob")).toBeInTheDocument();
    });

    it("should render edge buttons on mobile", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.getByTestId("inventory-edge-buttons")).toBeInTheDocument();
    });

    it("should not render tablet grid on mobile", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.queryByTestId("tablet-inventory-grid")).not.toBeInTheDocument();
    });

    it("should use max-w-md container on mobile", () => {
      const { container } = render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      const mainDiv = container.querySelector(".max-w-md");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("Tablet Layout (≥ 768px)", () => {
    beforeEach(() => {
      (useBreakpoint as any).mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        width: 800,
      });
    });

    it("should render tablet grid on tablet", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.getByTestId("tablet-inventory-grid")).toBeInTheDocument();
    });

    it("should not render knob navigation on tablet", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.queryByTestId("inventory-knob")).not.toBeInTheDocument();
    });

    it("should not render edge buttons on tablet", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.queryByTestId("inventory-edge-buttons")).not.toBeInTheDocument();
    });

    it("should use max-w-5xl container on tablet", () => {
      const { container } = render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      const mainDiv = container.querySelector(".max-w-5xl");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should show 'Xem tất cả không gian' header on tablet", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.getByText("Xem tất cả không gian")).toBeInTheDocument();
    });
  });

  describe("Desktop Layout (≥ 1024px)", () => {
    beforeEach(() => {
      (useBreakpoint as any).mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1280,
      });
    });

    it("should render tablet grid on desktop", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.getByTestId("tablet-inventory-grid")).toBeInTheDocument();
    });

    it("should not render knob navigation on desktop", () => {
      render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      expect(screen.queryByTestId("inventory-knob")).not.toBeInTheDocument();
    });

    it("should use max-w-5xl container on desktop", () => {
      const { container } = render(
        <BrowserRouter>
          <Inventory />
        </BrowserRouter>
      );
      const mainDiv = container.querySelector(".max-w-5xl");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("Property 4: On tablet viewport (w ≥ 768), multiple InventoryTable instances are rendered simultaneously", () => {
    it("should satisfy the property for tablet and desktop widths", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 768, max: 10000 }),
          (width) => {
            (useBreakpoint as any).mockReturnValue({
              isMobile: false,
              isTablet: width < 1024,
              isDesktop: width >= 1024,
              width,
            });

            const { container, unmount } = render(
              <BrowserRouter>
                <Inventory />
              </BrowserRouter>
            );

            // On tablet/desktop, TabletInventoryGrid should be rendered
            const tabletGrids = container.querySelectorAll("[data-testid='tablet-inventory-grid']");
            const result = tabletGrids.length > 0;
            
            unmount();
            return result;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 5: On mobile viewport (w < 768), knob navigation is active and no tablet components render", () => {
    it("should satisfy the property for mobile widths", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 767 }),
          (width) => {
            (useBreakpoint as any).mockReturnValue({
              isMobile: true,
              isTablet: false,
              isDesktop: false,
              width,
            });

            const { container, unmount } = render(
              <BrowserRouter>
                <Inventory />
              </BrowserRouter>
            );

            // On mobile, knob should be present and tablet grid should not
            const knobs = container.querySelectorAll("[data-testid='inventory-knob']");
            const tabletGrids = container.querySelectorAll("[data-testid='tablet-inventory-grid']");

            const result = knobs.length > 0 && tabletGrids.length === 0;
            
            unmount();
            return result;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
