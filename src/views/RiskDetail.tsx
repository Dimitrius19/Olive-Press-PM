import { useState } from "react";
import type { Risk } from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";

interface RiskDetailProps {
  risk: Risk;
  onUpdate: (id: string, updates: Partial<Omit<Risk, "id" | "created_at">>) => void;
}

export function RiskDetail({ risk, onUpdate }: RiskDetailProps) {
  const [notes, setNotes] = useState(risk.resolution_notes ?? "");

  function handleStatusChange(status: Risk["status"]) {
    onUpdate(risk.id, { status });
  }

  function handleNotesSave() {
    if (notes !== (risk.resolution_notes ?? "")) {
      onUpdate(risk.id, { resolution_notes: notes || null });
    }
  }

  return (
    <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 space-y-4">
      {/* Description */}
      {risk.description && (
        <div>
          <h4 className="text-xs font-medium text-stone-400 uppercase mb-1">
            Description
          </h4>
          <p className="text-sm text-stone-700">{risk.description}</p>
        </div>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="text-xs text-stone-400 block mb-1">Severity</span>
          <StatusBadge value={risk.severity} />
        </div>
        <div>
          <span className="text-xs text-stone-400 block mb-1">Probability</span>
          <StatusBadge value={risk.probability} />
        </div>
        <div>
          <span className="text-xs text-stone-400 block mb-1">Status</span>
          <select
            value={risk.status}
            onChange={(e) => handleStatusChange(e.target.value as Risk["status"])}
            className="text-xs border border-stone-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            <option value="open">Open</option>
            <option value="mitigating">Mitigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <span className="text-xs text-stone-400 block mb-1">Owner</span>
          <span className="text-sm text-stone-700">{risk.owner}</span>
        </div>
      </div>

      {/* Action items */}
      {risk.action_items.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-stone-400 uppercase mb-1">
            Action Items
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {risk.action_items.map((item, i) => (
              <li key={i} className="text-sm text-stone-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resolution notes */}
      <div>
        <h4 className="text-xs font-medium text-stone-400 uppercase mb-1">
          Resolution Notes
        </h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesSave}
          rows={3}
          className="w-full text-sm border border-stone-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
          placeholder="Add resolution notes..."
        />
      </div>
    </div>
  );
}
