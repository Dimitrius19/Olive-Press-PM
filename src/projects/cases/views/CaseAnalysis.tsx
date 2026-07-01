import { Section, Card, CardTitle, Callout, Stat, Rows, Pill, Chips } from "../ui";
import { useCase, useAccentUI } from "../context";

export function CaseAnalysis() {
  const c = useCase();
  const a = useAccentUI();
  const fin = c.financials;
  const build = c.buildability;

  return (
    <div>
      <Section
        eyebrow="The numbers"
        title="Valuation & pricing"
        intro="Per-square-metre metrics implied by the asking price, used to benchmark the deal against the local market."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {c.pricing.map((p) => (
            <Stat key={p.label} value={p.value} label={p.label} note={p.note} />
          ))}
        </div>
      </Section>

      {build && (
        <Section
          eyebrow="What can be built"
          title="Buildability"
          intro={build.intro}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {build.facts.map((f) => (
              <Stat key={f.label} value={f.value} label={f.label} note={f.note} />
            ))}
          </div>
          {build.uses && build.uses.length > 0 && (
            <Card>
              <CardTitle>Permitted uses</CardTitle>
              <Chips>
                {build.uses.map((u) => (
                  <Pill key={u} accent>
                    {u}
                  </Pill>
                ))}
              </Chips>
            </Card>
          )}
        </Section>
      )}

      {fin && (
        <Section
          eyebrow="Deal economics"
          title="Financials"
          intro="Indicative figures from the teaser — directional only, to be confirmed in diligence."
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
            <Card className={`border-l-4 ${a.softBorder} bg-gradient-to-b ${a.softFrom} to-white`}>
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
