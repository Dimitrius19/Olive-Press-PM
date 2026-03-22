import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchActivities, updateActivity } from "../../src/hooks/useActivities.ts";

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelectAfterUpdate = vi.fn();
const mockSingle = vi.fn();

vi.mock("../../src/lib/supabase.ts", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "activities") {
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

describe("fetchActivities", () => {
  it("returns activities ordered by number", async () => {
    const mockData = [
      { id: "1", number: 1, name: "Activity 1" },
      { id: "2", number: 2, name: "Activity 2" },
    ];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchActivities();

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("number");
    expect(result).toEqual(mockData);
  });

  it("throws on supabase error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });

    await expect(fetchActivities()).rejects.toThrow("DB error");
  });
});

describe("updateActivity", () => {
  it("updates an activity and returns the result", async () => {
    const mockData = { id: "1", status: "complete", progress_pct: 100 };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const result = await updateActivity("1", {
      status: "complete",
      progress_pct: 100,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "complete",
        progress_pct: 100,
        updated_at: expect.any(String) as string,
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "1");
    expect(result).toEqual(mockData);
  });

  it("throws on supabase error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error("Update failed") });

    await expect(
      updateActivity("1", { status: "in_progress" }),
    ).rejects.toThrow("Update failed");
  });
});
