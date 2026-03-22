import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRisks, createRisk, updateRisk } from "../../src/hooks/useRisks.ts";

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelectAfterMutation = vi.fn();
const mockSingle = vi.fn();

vi.mock("../../src/lib/supabase.ts", () => ({
  supabase: {
    from: vi.fn((_table: string) => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ order: mockOrder });
  mockInsert.mockReturnValue({ select: mockSelectAfterMutation });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ select: mockSelectAfterMutation });
  mockSelectAfterMutation.mockReturnValue({ single: mockSingle });
});

describe("fetchRisks", () => {
  it("returns risks ordered by created_at desc", async () => {
    const mockData = [{ id: "1", title: "Risk A" }];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchRisks();

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });
    await expect(fetchRisks()).rejects.toThrow("DB error");
  });
});

describe("createRisk", () => {
  it("inserts a new risk", async () => {
    const newRisk = {
      title: "Cost overrun",
      description: "Materials cost increase",
      category: "cost" as const,
      severity: "high" as const,
      probability: "medium" as const,
      status: "open" as const,
      owner: "PM",
      action_items: ["Monitor prices"],
      resolution_notes: null,
    };
    const mockData = { id: "new-1", ...newRisk };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const result = await createRisk(newRisk);

    expect(mockInsert).toHaveBeenCalledWith(newRisk);
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error("Insert failed") });
    await expect(
      createRisk({
        title: "X",
        description: "Y",
        category: "cost",
        severity: "low",
        probability: "low",
        status: "open",
        owner: "PM",
        action_items: [],
        resolution_notes: null,
      }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("updateRisk", () => {
  it("updates a risk", async () => {
    const mockData = { id: "1", status: "mitigating" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const result = await updateRisk("1", { status: "mitigating" });

    expect(mockUpdate).toHaveBeenCalledWith({ status: "mitigating" });
    expect(mockEq).toHaveBeenCalledWith("id", "1");
    expect(result).toEqual(mockData);
  });

  it("auto-sets resolved_at when status is resolved", async () => {
    const mockData = { id: "1", status: "resolved" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    await updateRisk("1", { status: "resolved" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        resolved_at: expect.any(String) as string,
      }),
    );
  });

  it("does not override explicit resolved_at", async () => {
    const mockData = { id: "1", status: "resolved" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const explicit = "2026-01-01T00:00:00.000Z";
    await updateRisk("1", { status: "resolved", resolved_at: explicit });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        resolved_at: explicit,
      }),
    );
  });

  it("throws on error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error("Update failed") });
    await expect(updateRisk("1", { status: "open" })).rejects.toThrow("Update failed");
  });
});
