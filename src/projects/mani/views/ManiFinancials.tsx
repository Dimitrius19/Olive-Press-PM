import { Section, Card, CardTitle, Callout, Rows, Pill, Chips } from "../ui";
import { financials } from "../data";

export function ManiFinancials() {
  const { caveat, income, waterfall, assumptions, capex, valuation } = financials;

  return (
    <Section
      eyebrow="The numbers"
      title="Financials"
      intro="Indicative figures from the development brochure — every table is draft and self-conflicting; treat as directional only."
    >
      <Callout tone="warn" title="Draft figures">
        {caveat}
      </Callout>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle em={income.grossAnnual}>Annual gross income</CardTitle>
          <Rows items={income.lines} />
        </Card>
        <Card>
          <CardTitle>Income waterfall</CardTitle>
          <Rows items={waterfall} />
        </Card>
      </div>

      <Card>
        <CardTitle>Key assumptions</CardTitle>
        <Chips>
          {assumptions.map((a) => (
            <Pill key={a}>{a}</Pill>
          ))}
        </Chips>
      </Card>

      <Card>
        <CardTitle em={capex.grandTotal}>Development capex</CardTitle>
        <div className="divide-y divide-stone-100">
          {capex.lines.map((l) => (
            <div key={l.label} className="py-2.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-stone-600">{l.label}</span>
                <span className="text-sm font-semibold text-stone-800 tabular-nums">{l.value}</span>
              </div>
              {l.detail && (
                <span className="block text-[11px] text-stone-400 mt-0.5">{l.detail}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Chips>
            {capex.funding.map((f) => (
              <Pill key={f} tone="terra">
                {f}
              </Pill>
            ))}
          </Chips>
        </div>
      </Card>

      <Card>
        <CardTitle>Valuation & equity split</CardTitle>
        <Callout tone="warn">{valuation.note}</Callout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2 mt-4">
          <Rows items={valuation.lines} />
          <Rows items={valuation.split} />
        </div>
      </Card>
    </Section>
  );
}
