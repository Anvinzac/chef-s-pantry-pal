import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabletOrderingLayout } from "./TabletOrderingLayout";
import { categories } from "@/data/defaultIngredients";

describe("TabletOrderingLayout", () => {
  const mockOnCategorySelect = vi.fn();

  it("should render all categories in sidebar", () => {
    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    categories.forEach((category) => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it("should highlight active category", () => {
    const activeCategory = categories[1];
    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={activeCategory.id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    const activeButton = screen.getByText(activeCategory.name).closest("button");
    expect(activeButton).toHaveClass("bg-primary/10");
    expect(activeButton).toHaveClass("text-primary");
  });

  it("should render children in main content area", () => {
    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div data-testid="test-content">Test Content</div>
      </TabletOrderingLayout>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("should call onCategorySelect when category is clicked", () => {
    const targetCategory = categories[2];

    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    const categoryButton = screen.getByText(targetCategory.name).closest("button");
    fireEvent.click(categoryButton!);

    expect(mockOnCategorySelect).toHaveBeenCalledWith(targetCategory.id);
  });

  it("should display alert counts when provided", () => {
    const alertCounts = {
      [categories[0].id]: 3,
      [categories[1].id]: 1,
    };

    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
        alertCounts={alertCounts}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    expect(screen.getByText("3 cảnh báo")).toBeInTheDocument();
    expect(screen.getByText("1 cảnh báo")).toBeInTheDocument();
  });

  it("should not display alert count when zero", () => {
    const alertCounts = {
      [categories[0].id]: 0,
    };

    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
        alertCounts={alertCounts}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    expect(screen.queryByText("0 cảnh báo")).not.toBeInTheDocument();
  });

  it("should render category emoji", () => {
    render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    categories.forEach((category) => {
      expect(screen.getByText(category.emoji)).toBeInTheDocument();
    });
  });

  it("should have sidebar with fixed width", () => {
    const { container } = render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    const sidebar = container.querySelector("aside");
    expect(sidebar).toHaveClass("w-52");
  });

  it("should have scrollable main content area", () => {
    const { container } = render(
      <TabletOrderingLayout
        categories={categories}
        activeCategory={categories[0].id}
        onCategorySelect={mockOnCategorySelect}
      >
        <div>Content</div>
      </TabletOrderingLayout>
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("overflow-y-auto");
  });
});
