import { Section, Card, CardTitle, Stat, Pill, Callout, Rows, Chips } from "../ui";
import { marketCheck as M } from "../data";

export function ManiMarketCheck() {
  return (
    <div>
      <Section
        eyebrow="Market context"
        title="Does the market support the concept?"
        intro={M.context}
      >
        <Card>
          <CardTitle>Demand drivers</CardTitle>
          <Chips>
            {M.demandDrivers.map((d) => (
              <Pill key={d} tone="olive">
                {d}
              </Pill>
            ))}
          </Chips>
        </Card>
      </Section>

      <Section
        eyebrow="Comparable set"
        title="Luxury & agro-tourism comparables"
        intro="Indicative peak-season nightly rates for the estates and resorts this project competes with — including the Domaine de Murtoli benchmark it cites."
      >
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] text-stone-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left font-semibold">Property</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Region</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Type</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Keys</th>
                  <th className="py-2.5 px-4 text-right font-semibold">ADR (indic.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {M.comps.map((c) => (
                  <tr key={c.name} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-4 font-medium text-stone-800">{c.name}</td>
                    <td className="py-2.5 px-3 text-stone-500">{c.region}</td>
                    <td className="py-2.5 px-3 text-stone-500">{c.type}</td>
                    <td className="py-2.5 px-3 text-stone-500 tabular-nums">{c.keys}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-stone-800 tabular-nums whitespace-nowrap">
                      {c.adr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section
        eyebrow="Reality check"
        title="Proposed rates vs the benchmark"
        intro="The brochure prices the estate well below the market it benchmarks against — the single biggest swing factor in the revenue model."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardTitle em="brochure">Proposed rate card</CardTitle>
            <Rows items={M.proposedRates} />
          </Card>
          <Card>
            <CardTitle em="market">Benchmark band</CardTitle>
            <Rows
              items={[
                { label: "5-star agro-tourism / resort comps", value: "€250 – €5,000+" },
                { label: "Cited benchmark — Domaine de Murtoli", value: "€700 – €5,000+" },
                { label: "Implied gap to proposed", value: "≈ 3× – 10×" },
              ]}
            />
          </Card>
        </div>
        <Callout tone="warn" title="Rate positioning">
          {M.rateFlag}
        </Callout>
      </Section>

      <Section
        eyebrow="Land vs going-concern"
        title="Land value against the claimed valuation"
        intro="Separating what the raw land is worth from what a fully-built, fully-operating resort might be worth."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat value="€2.2M" label="2016 transaction value" note="whole estate, per deed #6397" />
          <Stat value="€75M" label="Brochure “value now”" note="claimed — going-concern basis" />
          <Stat value="€150M" label="Brochure “end value”" note="claimed — built & operating" />
        </div>
        <Card>
          <CardTitle>Out-of-plan land comparables</CardTitle>
          <Rows items={M.landComps} />
        </Card>
        <Callout tone="warn" title="Valuation basis">
          {M.landFlag}
        </Callout>
      </Section>

      <Section eyebrow="Provenance" title="Basis of these figures">
        <Card>
          <p className="text-sm text-stone-500 leading-relaxed">{M.sourceNote}</p>
        </Card>
      </Section>
    </div>
  );
}
