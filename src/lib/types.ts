export interface Activity {
  id: string;
  number: number;
  name: string;
  assigned_to: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: "complete" | "in_progress" | "not_started";
  progress_pct: number;
  quarter: string;
  depends_on: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  code: string;
  name: string;
  building: "olive_press_1" | "olive_press_2" | "both";
  sort_order: number;
}

export interface BudgetLine {
  id: string;
  category_id: string;
  description: string;
  original_estimate: number;
  anicon_revised: number;
  actual_amount: number;
  cost_per_sqm: number | null;
  cost_per_key: number | null;
  notes: string | null;
  flagged: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  category: "permit" | "study" | "plan" | "photo" | "report" | "contract";
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  tags: string[];
  created_at: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: "cost" | "schedule" | "permit" | "technical" | "other";
  severity: "high" | "medium" | "low";
  probability: "high" | "medium" | "low";
  status: "open" | "mitigating" | "resolved";
  owner: string;
  action_items: string[];
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string | null;
  sort_order: number;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}
