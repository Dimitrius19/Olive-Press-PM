import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../../src/components/StatusBadge.tsx";

describe("StatusBadge", () => {
  const cases = [
    { value: "complete", label: "Complete", colorClass: "bg-green-100" },
    { value: "in_progress", label: "In Progress", colorClass: "bg-blue-100" },
    { value: "not_started", label: "Not Started", colorClass: "bg-stone-100" },
    { value: "open", label: "Open", colorClass: "bg-red-100" },
    { value: "mitigating", label: "Mitigating", colorClass: "bg-amber-100" },
    { value: "resolved", label: "Resolved", colorClass: "bg-green-100" },
    { value: "high", label: "High", colorClass: "bg-red-100" },
    { value: "medium", label: "Medium", colorClass: "bg-amber-100" },
    { value: "low", label: "Low", colorClass: "bg-green-100" },
  ] as const;

  for (const { value, label, colorClass } of cases) {
    it(`renders "${label}" with ${colorClass} for value="${value}"`, () => {
      render(<StatusBadge value={value} />);

      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(colorClass);
    });
  }
});
