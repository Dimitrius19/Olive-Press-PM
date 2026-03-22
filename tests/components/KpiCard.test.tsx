import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "../../src/components/KpiCard.tsx";

describe("KpiCard", () => {
  it("renders label and value", () => {
    render(<KpiCard label="Total Rooms" value="48" />);

    expect(screen.getByText("Total Rooms")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <KpiCard label="Budget" value="€8.3M" subtitle="Revised estimate" />,
    );

    expect(screen.getByText("Revised estimate")).toBeInTheDocument();
  });

  it("does not render subtitle when omitted", () => {
    const { container } = render(<KpiCard label="Rooms" value="48" />);

    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("applies default variant border class", () => {
    const { container } = render(<KpiCard label="A" value="B" />);
    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain("border-stone-200");
  });

  it("applies success variant border class", () => {
    const { container } = render(
      <KpiCard label="A" value="B" variant="success" />,
    );
    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain("border-green-200");
  });

  it("applies warning variant border class", () => {
    const { container } = render(
      <KpiCard label="A" value="B" variant="warning" />,
    );
    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain("border-amber-200");
  });

  it("applies danger variant border class", () => {
    const { container } = render(
      <KpiCard label="A" value="B" variant="danger" />,
    );
    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain("border-red-200");
  });
});
