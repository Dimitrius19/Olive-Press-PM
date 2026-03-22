import { useState, useMemo, useCallback } from "react";
import {
  useTeam,
  useCreateTeamMember,
  useUpdateTeamMember,
} from "../hooks/useTeam";
import type { TeamMember } from "../lib/types";

interface EditFields {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export function Team() {
  const { data: members, isLoading, error } = useTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    name: "",
    role: "",
    email: "",
    phone: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const grouped = useMemo(() => {
    if (!members) return new Map<string, TeamMember[]>();
    const map = new Map<string, TeamMember[]>();
    for (const m of members) {
      const org = m.organization || "Other";
      if (!map.has(org)) map.set(org, []);
      map.get(org)!.push(m);
    }
    return map;
  }, [members]);

  const startEdit = useCallback((m: TeamMember) => {
    setEditingId(m.id);
    setEditFields({
      name: m.name,
      role: m.role,
      email: m.email,
      phone: m.phone ?? "",
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    updateMember.mutate(
      {
        id: editingId,
        updates: {
          name: editFields.name,
          role: editFields.role,
          email: editFields.email,
          phone: editFields.phone || null,
        },
      },
      { onSuccess: () => setEditingId(null) },
    );
  }, [editingId, editFields, updateMember]);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMember.mutate(
      {
        name: fd.get("name") as string,
        role: fd.get("role") as string,
        organization: fd.get("organization") as string,
        email: fd.get("email") as string,
        phone: (fd.get("phone") as string) || null,
        sort_order: (members?.length ?? 0) + 1,
      },
      { onSuccess: () => setShowAddForm(false) },
    );
  }

  if (isLoading) return <p className="text-stone-400">Loading team...</p>;
  if (error)
    return (
      <p className="text-red-500">
        Failed to load team: {(error as Error).message}
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">Team Directory</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-stone-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            name="name"
            required
            placeholder="Full name"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <input
            name="role"
            required
            placeholder="Role"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <input
            name="organization"
            required
            placeholder="Organization"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <div className="flex gap-2 justify-end items-center">
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

      {/* Grouped cards */}
      {Array.from(grouped.entries()).map(([org, orgMembers]) => (
        <div key={org}>
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            {org}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgMembers.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => {
                  if (editingId !== m.id) startEdit(m);
                }}
              >
                {editingId === m.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={editFields.name}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full border border-stone-200 rounded px-2 py-1 text-sm"
                      placeholder="Name"
                    />
                    <input
                      value={editFields.role}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, role: e.target.value }))
                      }
                      className="w-full border border-stone-200 rounded px-2 py-1 text-sm"
                      placeholder="Role"
                    />
                    <input
                      value={editFields.email}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full border border-stone-200 rounded px-2 py-1 text-sm"
                      placeholder="Email"
                    />
                    <input
                      value={editFields.phone}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full border border-stone-200 rounded px-2 py-1 text-sm"
                      placeholder="Phone"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-xs text-stone-500 hover:text-stone-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-stone-800 text-white text-xs rounded hover:bg-stone-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-stone-800">{m.name}</p>
                    <p className="text-sm text-stone-500">{m.role}</p>
                    <div className="mt-3 space-y-1 text-xs text-stone-400">
                      <p>{m.email}</p>
                      {m.phone && <p>{m.phone}</p>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
