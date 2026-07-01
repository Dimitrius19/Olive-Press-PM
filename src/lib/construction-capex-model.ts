// Detailed construction CAPEX model — Supernatural AE (Ellinikon / Athens Riviera villa).
// A bottom-up, elemental cost plan that sits alongside the build-to-sell model in
// build-sell-model.ts. Where that model takes construction as a single lump sum, this one
// breaks it into editable line items grouped by elemental category, then applies the same
// escalation / contingency / VAT wrappers so the "all-in" total reconciles, line-for-line,
// with the Build-Sell "effective construction cost" for matching assumptions.

export const CAPEX_CATEGORIES = [
  "Substructure",
  "Superstructure",
  "Building Envelope & Openings",
  "Internal Finishes",
  "MEP / Services",
  "External Works",
  "Preliminaries",
] as const;

export type CapexCategory = (typeof CAPEX_CATEGORIES)[number];

export interface CapexLineItem {
  id: string;
  category: string; // one of CAPEX_CATEGORIES (string to allow user-added lines)
  name: string;
  cost: number; // € base estimate, today's prices
}

export interface CapexInputs {
  lineItems: CapexLineItem[];
  builtArea: number; // m² GBA, for €/m² derivations
  contingencyPct: number; // % of escalated construction cost
  costEscalationPct: number; // annual escalation, compounded to the spend midpoint
  escalationYears: number; // years from base estimate to cost-weighted spend midpoint
  vatRate: number; // VAT rate on construction spend
  vatRecoverable: boolean; // if false, input VAT is irrecoverable and added to cost
}

export interface CapexItemSummary extends CapexLineItem {
  pctOfBase: number;
  costPerSqm: number;
}

export interface CapexCategorySummary {
  category: string;
  cost: number;
  pctOfBase: number;
  costPerSqm: number;
  items: CapexItemSummary[];
}

export interface CapexResult {
  baseCost: number; // sum of all line items (today's prices)
  categories: CapexCategorySummary[];
  // Build-up to all-in (same order as the Build-Sell model, so the totals reconcile)
  escalatedCost: number; // base escalated to the spend midpoint
  escalationAmount: number; // escalatedCost − baseCost
  contingencyAmount: number; // contingency on the escalated cost
  subtotalExVat: number; // escalated + contingency
  vatAmount: number; // VAT added when irrecoverable, else 0
  allInCost: number; // subtotalExVat + vatAmount
  baseCostPerSqm: number;
  allInCostPerSqm: number;
}

// Default elemental breakdown for a ~2,000 m² ultra-prime Ellinikon villa. Sums to the
// €13.0m construction base used by the Build-Sell model (≈ €6,500/m²).
export const CAPEX_DEFAULT_LINE_ITEMS: CapexLineItem[] = [
  // Substructure — €1.56m
  { id: "sub-1", category: "Substructure", name: "Excavation & earthworks", cost: 560_000 },
  { id: "sub-2", category: "Substructure", name: "Foundations & basement", cost: 1_000_000 },
  // Superstructure — €3.64m
  { id: "sup-1", category: "Superstructure", name: "Structural frame & slabs", cost: 2_000_000 },
  { id: "sup-2", category: "Superstructure", name: "Roof & waterproofing", cost: 640_000 },
  { id: "sup-3", category: "Superstructure", name: "External walls & masonry", cost: 1_000_000 },
  // Building Envelope & Openings — €1.30m
  { id: "env-1", category: "Building Envelope & Openings", name: "Windows & external doors (glazing)", cost: 900_000 },
  { id: "env-2", category: "Building Envelope & Openings", name: "External cladding & stonework", cost: 400_000 },
  // Internal Finishes — €1.95m
  { id: "fin-1", category: "Internal Finishes", name: "Floor finishes", cost: 800_000 },
  { id: "fin-2", category: "Internal Finishes", name: "Wall & ceiling finishes", cost: 650_000 },
  { id: "fin-3", category: "Internal Finishes", name: "Internal doors & joinery", cost: 500_000 },
  // MEP / Services — €2.60m
  { id: "mep-1", category: "MEP / Services", name: "Electrical & lighting", cost: 800_000 },
  { id: "mep-2", category: "MEP / Services", name: "HVAC & ventilation", cost: 900_000 },
  { id: "mep-3", category: "MEP / Services", name: "Plumbing & sanitary", cost: 600_000 },
  { id: "mep-4", category: "MEP / Services", name: "Smart home, security & lift", cost: 300_000 },
  // External Works — €1.30m
  { id: "ext-1", category: "External Works", name: "Swimming pool & wellness", cost: 500_000 },
  { id: "ext-2", category: "External Works", name: "Landscaping & hardscaping", cost: 600_000 },
  { id: "ext-3", category: "External Works", name: "External services & utilities", cost: 200_000 },
  // Preliminaries — €0.65m
  { id: "pre-1", category: "Preliminaries", name: "Site setup, management & temporary works", cost: 650_000 },
];

// Working base case for the live app. The line items are today's-prices estimates; the
// wrappers project them onto a Sep-2027 construction start: ~4%/yr cost escalation across
// 2.25yr to the cost-weighted spend midpoint (≈ mid-2028) and a 7.5% design-stage
// contingency. VAT (24%) is held recoverable in the base case (netted out), but the rate
// and treatment toggle are right there to stress. This all-in (~€15.26m) is what drives the
// Ellinikon Villa model's construction cost.
export const CAPEX_DEFAULTS: CapexInputs = {
  lineItems: CAPEX_DEFAULT_LINE_ITEMS,
  builtArea: 2_000,
  contingencyPct: 0.075,
  costEscalationPct: 0.04,
  escalationYears: 2.25,
  vatRate: 0.24,
  vatRecoverable: true,
};

export function runCapexModel(inputs: CapexInputs): CapexResult {
  const baseCost = inputs.lineItems.reduce((s, it) => s + it.cost, 0);
  const area = inputs.builtArea > 0 ? inputs.builtArea : 0;
  const perSqm = (v: number) => (area > 0 ? v / area : 0);
  const pct = (v: number) => (baseCost > 0 ? v / baseCost : 0);

  // Group into categories, preserving the canonical category order, dropping any empty ones.
  const categories: CapexCategorySummary[] = CAPEX_CATEGORIES.map((category) => {
    const items = inputs.lineItems.filter((it) => it.category === category);
    const cost = items.reduce((s, it) => s + it.cost, 0);
    return {
      category,
      cost,
      pctOfBase: pct(cost),
      costPerSqm: perSqm(cost),
      items: items.map((it) => ({
        ...it,
        pctOfBase: pct(it.cost),
        costPerSqm: perSqm(it.cost),
      })),
    };
  }).filter((c) => c.items.length > 0);

  // Any line items in user-added categories outside the canonical list go into a trailing
  // "Other" group so nothing is silently dropped from the total.
  const known = new Set<string>(CAPEX_CATEGORIES);
  const otherItems = inputs.lineItems.filter((it) => !known.has(it.category));
  if (otherItems.length > 0) {
    const cost = otherItems.reduce((s, it) => s + it.cost, 0);
    categories.push({
      category: "Other",
      cost,
      pctOfBase: pct(cost),
      costPerSqm: perSqm(cost),
      items: otherItems.map((it) => ({
        ...it,
        pctOfBase: pct(it.cost),
        costPerSqm: perSqm(it.cost),
      })),
    });
  }

  // Build-up to the all-in cost. Order matches build-sell-model.ts exactly: escalate the
  // base to the spend midpoint, add contingency on the escalated figure, then add VAT (only
  // when irrecoverable) on the ex-VAT subtotal.
  const escalatedCost =
    baseCost * Math.pow(1 + inputs.costEscalationPct, inputs.escalationYears);
  const escalationAmount = escalatedCost - baseCost;
  const contingencyAmount = escalatedCost * inputs.contingencyPct;
  const subtotalExVat = escalatedCost + contingencyAmount;
  const vatAmount = inputs.vatRecoverable ? 0 : subtotalExVat * inputs.vatRate;
  const allInCost = subtotalExVat + vatAmount;

  return {
    baseCost,
    categories,
    escalatedCost,
    escalationAmount,
    contingencyAmount,
    subtotalExVat,
    vatAmount,
    allInCost,
    baseCostPerSqm: perSqm(baseCost),
    allInCostPerSqm: perSqm(allInCost),
  };
}
