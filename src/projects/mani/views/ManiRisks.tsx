import { Section, Card, Stat, Pill } from "../ui";
import { StatusBadge } from "../../../components/StatusBadge";
import { riskRegister } from "../data";

export function ManiRisks() {
  const high = riskRegister.filter((r) => r.severity === "high").length;
  const open = riskRegister.filter((r) => r.status === "open").length;
  const mitigating = riskRegister.filter((r) => r.status === "mitigating").length;

  return (
    <div>
      <Section
        eyebrow="Risk register"
        title="Rated risk register"
        intro="A prioritised, rated view of the issues raised in due diligence and the market check — each with a severity, likelihood and the mitigation needed before capital is committed."
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={String(riskRegister.length)} label="Tracked risks" />
          <Stat value={String(high)} label="High severity" note="priority items" />
          <Stat value={String(open)} label="Open" note="not yet mitigated" />
          <Stat value={String(mitigating)} label="Mitigating" note="in progress" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {riskRegister.map((r, i) => (
            <Card key={r.title} className="!p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-bold text-amber-700/30 tabular-nums leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-stone-800 leading-snug">{r.title}</h3>
                    <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                      {r.category}
                    </span>
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[11px] text-stone-400 font-medium">Severity</span>
                <StatusBadge value={r.severity} />
                <span className="text-[11px] text-stone-400 font-medium ml-2">Likelihood</span>
                <StatusBadge value={r.probability} />
              </div>

              <p className="text-[13px] text-stone-500 leading-relaxed mt-3">
                <span className="font-semibold text-stone-600">Mitigation: </span>
                {r.mitigation}
              </p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Pill tone="terra">Read alongside</Pill>
            <span>
              the <span className="font-medium text-stone-700">Due Diligence</span> tab (narrative flags &amp;
              source documents) and the <span className="font-medium text-stone-700">Market Check</span> tab
              (rate &amp; valuation reality check).
            </span>
          </div>
        </Card>
      </Section>
    </div>
  );
}
