import { Section, Card, CardTitle, Callout, Stat, Rows } from "../ui";
import { useCase, useAccentUI } from "../context";
import type { CaseRow } from "../types";
import {
  computeModel,
  scoreCase,
  fmtMoney,
  fmtMoneyCompact,
  fmtPct,
  fmtX,
} from "../model";
import { RiskScorecard } from "../../../components/RiskScorecard";

export function CaseFinancials() {
  const c = useCase();
  const a = useAccentUI();
  const m = c.model;

  if (!m) {
    return (
      <Section eyebrow="Deal economics" title="Financials">
        <Callout tone="info" title="No model">
          A financial model has not yet been built for this opportunity.
        </Callout>
      </Section>
    );
  }

  const r = computeModel(m);
  const score = scoreCase(r, c.risks, m.operationalRisk);
  const isDev = m.mode === "development";

  // Going-in yield for income assets: year-1 NOI over the all-in acquisition cost.
  const entryYield =
    !isDev && m.income
      ? m.income.noi.find((v) => v > 0)! / (m.landPrice * (1 + m.acquisitionCostsPct))
      : NaN;

  const metrics = [
    { value: fmtPct(r.projectIrr), label: "Project IRR", note: "unlevered" },
    { value: fmtPct(r.equityIrr), label: "Equity IRR", note: m.finance.label ?? "levered" },
    { value: fmtX(r.equityMultiple), label: "Equity multiple", note: "MOIC" },
    isDev
      ? { value: fmtPct(r.profitOnCost), label: "Profit on cost", note: "unlevered" }
      : { value: fmtPct(entryYield), label: "Going-in yield", note: "NOI / cost" },
    { value: fmtMoney(r.gdv), label: isDev ? "Gross dev. value" : "Exit value" },
    { value: fmtMoney(r.totalCost), label: "Total cost" },
    { value: fmtMoney(r.profit), label: "Profit", note: "unlevered" },
    { value: fmtMoney(r.peakFunding), label: "Peak equity", note: "max funding" },
  ];

  const assumptions: CaseRow[] = isDev
    ? [
        { label: m.landLabel ?? "Land", value: fmtMoney(m.landPrice) },
        {
          label: "Acquisition costs",
          value: `${fmtPct(m.acquisitionCostsPct)} · ${fmtMoney(m.landPrice * m.acquisitionCostsPct)}`,
        },
        { label: m.construction?.label ?? "Build all-in", value: fmtMoney(r.constructionAllIn) },
        {
          label: "GDV basis",
          value: `${m.sale!.saleableArea.toLocaleString()} m² × €${m.sale!.pricePerSqm.toLocaleString()}/m²`,
        },
        { label: "Gross development value", value: fmtMoney(r.gdv) },
        { label: "Financing", value: m.finance.label ?? `${fmtPct(m.finance.ltcPct, 0)} LTC` },
      ]
    : [
        { label: m.landLabel ?? "Asset", value: fmtMoney(m.landPrice) },
        {
          label: "Acquisition costs",
          value: `${fmtPct(m.acquisitionCostsPct)} · ${fmtMoney(m.landPrice * m.acquisitionCostsPct)}`,
        },
        { label: "Stabilised NOI", value: `${fmtMoney(m.income!.exitNoi)} / yr` },
        { label: "Exit cap rate", value: fmtPct(m.income!.exitCapRate, 2) },
        { label: "Exit value", value: fmtMoney(r.gdv) },
        { label: "Hold period", value: `${m.income!.exitYear} years` },
        { label: "Financing", value: m.finance.label ?? `${fmtPct(m.finance.ltcPct, 0)} LTV` },
      ];

  const fin = c.financials;

  return (
    <div>
      <Section
        eyebrow="Deal economics"
        title="Financial model"
        intro="A year-by-year cash flow layered on the teaser facts, resolving to a project (unlevered) and equity (levered) IRR. Figures are illustrative — they frame the return, not underwrite it."
      >
        <Callout tone="info" title="Illustrative">
          {m.note}
        </Callout>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {metrics.map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} note={s.note} />
          ))}
        </div>

        <Card>
          <CardTitle em={m.mode === "development" ? "Merchant build" : "Income & exit"}>
            Assumptions
          </CardTitle>
          <Rows items={assumptions} />
        </Card>
      </Section>

      <Section
        eyebrow="The waterfall"
        title="Year-by-year cash flow"
        intro="Costs, sale or operating revenue, the unlevered net and its running total, and the equity cash flow after debt is drawn and repaid."
      >
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm tabular-nums">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-stone-400 text-right">
                <th className="text-left font-semibold pb-2">Year</th>
                <th className="font-semibold pb-2">Cost</th>
                <th className="font-semibold pb-2">Revenue</th>
                <th className="font-semibold pb-2">Net</th>
                <th className="font-semibold pb-2">Cumulative</th>
                <th className="font-semibold pb-2">Equity CF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {r.rows.map((row) => (
                <tr key={row.year} className="text-right">
                  <td className="text-left font-semibold text-stone-700 py-2">{row.year}</td>
                  <td className="text-stone-500 py-2">
                    {row.cost > 0 ? fmtMoneyCompact(-row.cost) : "—"}
                  </td>
                  <td className="text-stone-500 py-2">
                    {row.revenue > 0 ? fmtMoneyCompact(row.revenue) : "—"}
                  </td>
                  <td
                    className={`font-medium py-2 ${row.unlevered >= 0 ? "text-emerald-700" : "text-rose-600"}`}
                  >
                    {fmtMoneyCompact(row.unlevered)}
                  </td>
                  <td className="text-stone-500 py-2">{fmtMoneyCompact(row.cumUnlevered)}</td>
                  <td
                    className={`font-medium py-2 ${row.equity >= 0 ? "text-emerald-700" : "text-rose-600"}`}
                  >
                    {fmtMoneyCompact(row.equity)}
                  </td>
                </tr>
              ))}
              <tr className="text-right font-bold text-stone-800 border-t-2 border-stone-200">
                <td className="text-left py-2">Total</td>
                <td className="py-2">{fmtMoneyCompact(-r.totalCost)}</td>
                <td className="py-2">{fmtMoneyCompact(r.totalRevenue)}</td>
                <td className={`py-2 ${r.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {fmtMoneyCompact(r.profit)}
                </td>
                <td className="py-2 text-stone-400">—</td>
                <td className={`py-2 ${r.leveredProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {fmtMoneyCompact(r.leveredProfit)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
            Debt drawn at {fmtPct(m.finance.ltcPct, 0)}
            {isDev ? " of cost" : " of price"}, interest {fmtPct(m.finance.interestRate, 1)}
            {m.finance.interestOnly ? ", interest-only (principal repaid at exit)." : ", capitalised and swept by sale proceeds."} Total interest ≈ {fmtMoney(r.totalInterest)}.
          </p>
        </Card>
      </Section>

      <Section
        eyebrow="Risk-adjusted view"
        title="Scorecard"
        intro="Each deal is scored 0–100 on three axes — the modelled return, the development risk on the register, and the operational burden of the asset — then blended (IRR 50%, development risk 30%, operational 20%) into a single grade."
      >
        <RiskScorecard scorecard={score} softBorder={a.softBorder} softFrom={a.softFrom} />
      </Section>

      {fin && (
        <Section
          eyebrow="From the teaser"
          title="As-quoted figures"
          intro="The headline economics as stated in the opportunity teaser, shown alongside the model above."
        >
          {fin.note && (
            <Callout tone="warn" title="Draft figures">
              {fin.note}
            </Callout>
          )}
          <Card>
            <CardTitle>Headline economics</CardTitle>
            <Rows items={fin.lines} />
          </Card>
          {fin.scenario && (
            <Card>
              <CardTitle>{fin.scenario.title}</CardTitle>
              <Rows items={fin.scenario.lines} />
              {fin.scenario.conclusion && (
                <p className="text-sm text-stone-700 leading-relaxed mt-4 font-medium">
                  {fin.scenario.conclusion}
                </p>
              )}
            </Card>
          )}
        </Section>
      )}
    </div>
  );
}
