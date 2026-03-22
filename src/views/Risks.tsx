import { useState, useMemo, useCallback } from "react";
import { useRisks, useCreateRisk, useUpdateRisk } from "../hooks/useRisks";
import { StatusBadge } from "../components/StatusBadge";
import { RiskDetail } from "./RiskDetail";
import type { Risk } from "../lib/types";

type FilterStatus = "all" | Risk["status"];

export function Risks() {
  const { data: risks, isLoading, error } = useRisks();
  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const counts = useMemo(() => {
    if (!risks) return { open: 0, mitigating: 0 };
    return {
      open: risks.filter((r) => r.status === "open").length,
      mitigating: risks.filter((r) => r.status === "mitigating").length,
    };
  }, [risks]);

  const filtered = useMemo(() => {
    if (!risks) return [];
    if (filter === "all") return risks;
    return risks.filter((r) => r.status === filter);
  }, [risks, filter]);

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Omit<Risk, "id" | "created_at">>) => {
      updateRisk.mutate({ id, updates });
    },
    [updateRisk],
  );

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createRisk.mutate(
      {
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        category: (fd.get("category") as Risk["category"]) || "other",
        severity: (fd.get("severity") as Risk["severity"]) || "medium",
        probability: (fd.get("probability") as Risk["probability"]) || "medium",
        status: "open",
        owner: fd.get("owner") as string,
        action_items: [],
        resolution_notes: null,
      },
      { onSuccess: () => setShowAddForm(false) },
    );
  }

  if (isLoading) return <p className="text-stone-400">Loading risks...</p>;
  if (error)
    return (
      <p className="text-red-500">
        Failed to load risks: {(error as Error).message}
      </p>
    );

  const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Open", value: "open" },
    { label: "Mitigating", value: "mitigating" },
    { label: "Resolved", value: "resolved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">
            Risks & Issues
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            {counts.open} open &middot; {counts.mitigating} mitigating
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
        >
          + Add Risk
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-stone-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            name="title"
            required
            placeholder="Risk title"
            className="col-span-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={2}
            className="col-span-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <select
            name="category"
            className="border border-stone-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="cost">Cost</option>
            <option value="schedule">Schedule</option>
            <option value="permit">Permit</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
          <select
            name="severity"
            className="border border-stone-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            name="probability"
            className="border border-stone-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            name="owner"
            required
            placeholder="Owner"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <div className="col-span-full flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f.value
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200 text-[11px] text-stone-400 uppercase">
              <th className="py-2 px-4 text-left font-medium">Title</th>
              <th className="py-2 px-3 text-left font-medium">Category</th>
              <th className="py-2 px-3 text-left font-medium">Severity</th>
              <th className="py-2 px-3 text-left font-medium">Owner</th>
              <th className="py-2 px-3 text-left font-medium">Status</th>
              <th className="py-2 px-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((risk) => (
              <tr key={risk.id} className="group">
                <td colSpan={6} className="p-0">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === risk.id ? null : risk.id)
                    }
                    className="w-full text-left grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center border-b border-stone-100 hover:bg-stone-50"
                  >
                    <span className="py-2 px-4 text-sm text-stone-700 font-medium truncate">
                      {risk.title}
                    </span>
                    <span className="py-2 px-3 text-xs text-stone-500 capitalize">
                      {risk.category}
                    </span>
                    <span className="py-2 px-3">
                      <StatusBadge value={risk.severity} />
                    </span>
                    <span className="py-2 px-3 text-xs text-stone-500">
                      {risk.owner}
                    </span>
                    <span className="py-2 px-3">
                      <StatusBadge value={risk.status} />
                    </span>
                    <span className="py-2 px-3 text-xs text-stone-400">
                      {new Date(risk.created_at).toLocaleDateString()}
                    </span>
                  </button>
                  {expandedId === risk.id && (
                    <RiskDetail risk={risk} onUpdate={handleUpdate} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">
            No risks match the current filter.
          </p>
        )}
      </div>
    </div>
  );
}
