import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabletInventoryGrid } from "./TabletInventoryGrid";
import { KITCHEN_SPACES } from "@/lib/inventoryNav";

// Mock the InventoryTable component
vi.mock("./InventoryTable", () => ({
  InventoryTable: ({ id, label, emoji }: any) => (
    <div data-testid={`inventory-table-${id}`}>
      {emoji} {label}
    </div>
  ),
}));

describe("TabletInventoryGrid", () => {
  it("should render all 9 kitchen spaces", () => {
    render(<TabletInventoryGrid />);
    
    KITCHEN_SPACES.forEach((space) => {
      expect(screen.getByTestId(`inventory-table-${space.id}`)).toBeInTheDocument();
    });
  });

  it("should render exactly 9 InventoryTable instances", () => {
    const { container } = render(<TabletInventoryGrid />);
    const tables = container.querySelectorAll("[data-testid^='inventory-table-']");
    expect(tables).toHaveLength(9);
  });

  it("should accept custom spaces prop", () => {
    const customSpaces = KITCHEN_SPACES.slice(0, 3);
    render(<TabletInventoryGrid spaces={customSpaces} />);
    
    customSpaces.forEach((space) => {
      expect(screen.getByTestId(`inventory-table-${space.id}`)).toBeInTheDocument();
    });
    
    // Verify spaces not in custom list are not rendered
    KITCHEN_SPACES.slice(3).forEach((space) => {
      expect(screen.queryByTestId(`inventory-table-${space.id}`)).not.toBeInTheDocument();
    });
  });

  it("should apply grid column classes for responsive layout", () => {
    const { container } = render(<TabletInventoryGrid />);
    const gridContainer = container.querySelector(".grid");
    
    expect(gridContainer).toHaveClass("grid-cols-2");
    expect(gridContainer).toHaveClass("lg:grid-cols-3");
  });

  it("should pass correct props to each InventoryTable", () => {
    render(<TabletInventoryGrid />);
    
    KITCHEN_SPACES.forEach((space) => {
      const table = screen.getByTestId(`inventory-table-${space.id}`);
      expect(table).toHaveTextContent(space.emoji);
      expect(table).toHaveTextContent(space.label);
    });
  });

  it("should call onSpaceSelect when a space is clicked", () => {
    const onSpaceSelect = vi.fn();
    render(<TabletInventoryGrid onSpaceSelect={onSpaceSelect} />);
    
    const firstSpace = KITCHEN_SPACES[0];
    const spaceElement = screen.getByTestId(`inventory-table-${firstSpace.id}`).closest("div");
    
    spaceElement?.click();
    expect(onSpaceSelect).toHaveBeenCalledWith(firstSpace);
  });

  it("should have fixed height cells for independent scrolling", () => {
    const { container } = render(<TabletInventoryGrid />);
    const cells = container.querySelectorAll(".h-96");
    
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => {
      expect(cell).toHaveClass("h-96");
    });
  });

  it("should apply border and shadow styling to cells", () => {
    const { container } = render(<TabletInventoryGrid />);
    const cells = container.querySelectorAll(".border");
    
    cells.forEach((cell) => {
      expect(cell).toHaveClass("border");
      expect(cell).toHaveClass("rounded-lg");
      expect(cell).toHaveClass("shadow-sm");
    });
  });
});
