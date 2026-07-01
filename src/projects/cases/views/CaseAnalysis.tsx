import { Section, Card, CardTitle, Stat, Pill, Chips } from "../ui";
import { useCase } from "../context";

export function CaseAnalysis() {
  const c = useCase();
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
    </div>
  );
}
