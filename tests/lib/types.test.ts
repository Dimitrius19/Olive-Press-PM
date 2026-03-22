import { describe, it, expect } from "vitest";
import type { Activity, BudgetLine, Risk } from "../../src/lib/types";

describe("Activity type", () => {
  it("should accept a valid Activity object", () => {
    const activity: Activity = {
      id: "abc-123",
      number: 1,
      name: "Site preparation",
      assigned_to: "Anicon",
      start_date: "2025-01-15",
      end_date: "2025-02-15",
      duration_days: 31,
      status: "in_progress",
      progress_pct: 45,
      quarter: "Q1 2025",
      depends_on: [],
      notes: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
    };

    expect(activity.status).toBe("in_progress");
    expect(activity.progress_pct).toBe(45);
    expect(activity.depends_on).toEqual([]);
  });
});

describe("BudgetLine type", () => {
  it("should accept a valid BudgetLine object", () => {
    const line: BudgetLine = {
      id: "bl-001",
      category_id: "cat-001",
      description: "Structural steel",
      original_estimate: 150000,
      anicon_revised: 165000,
      actual_amount: 0,
      cost_per_sqm: 120.5,
      cost_per_key: null,
      notes: "Price increase due to supply chain",
      flagged: true,
      sort_order: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
    };

    expect(line.flagged).toBe(true);
    expect(line.cost_per_sqm).toBe(120.5);
    expect(line.cost_per_key).toBeNull();
  });
});

describe("Risk type", () => {
  it("should accept a valid Risk object", () => {
    const risk: Risk = {
      id: "risk-001",
      title: "Permit delay",
      description: "Building permit may be delayed due to archaeological findings",
      category: "permit",
      severity: "high",
      probability: "medium",
      status: "open",
      owner: "Legal Team",
      action_items: ["Contact archaeology dept", "Prepare contingency plan"],
      resolution_notes: null,
      created_at: "2025-01-01T00:00:00Z",
      resolved_at: null,
    };

    expect(risk.severity).toBe("high");
    expect(risk.status).toBe("open");
    expect(risk.action_items).toHaveLength(2);
    expect(risk.resolved_at).toBeNull();
  });
});
