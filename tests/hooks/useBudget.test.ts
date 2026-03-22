import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchBudgetCategories,
  fetchBudgetLines,
  updateBudgetLine,
} from "../../src/hooks/useBudget.ts";

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelectAfterUpdate = vi.fn();
const mockSingle = vi.fn();

vi.mock("../../src/lib/supabase.ts", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "budget_categories" || table === "budget_lines") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ order: mockOrder });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ select: mockSelectAfterUpdate });
  mockSelectAfterUpdate.mockReturnValue({ single: mockSingle });
});

describe("fetchBudgetCategories", () => {
  it("returns categories ordered by sort_order", async () => {
    const mockData = [{ id: "1", code: "A", name: "Construction" }];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchBudgetCategories();

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("sort_order");
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });
    await expect(fetchBudgetCategories()).rejects.toThrow("DB error");
  });
});

describe("fetchBudgetLines", () => {
  it("returns lines ordered by sort_order", async () => {
    const mockData = [{ id: "1", description: "Structural" }];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchBudgetLines();

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("sort_order");
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });
    await expect(fetchBudgetLines()).rejects.toThrow("DB error");
  });
});

describe("updateBudgetLine", () => {
  it("updates actual_amount and notes", async () => {
    const mockData = { id: "1", actual_amount: 50000, notes: "Updated" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const result = await updateBudgetLine("1", {
      actual_amount: 50000,
      notes: "Updated",
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        actual_amount: 50000,
        notes: "Updated",
        updated_at: expect.any(String) as string,
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "1");
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error("Update failed") });
    await expect(updateBudgetLine("1", { actual_amount: 0 })).rejects.toThrow("Update failed");
  });
});
