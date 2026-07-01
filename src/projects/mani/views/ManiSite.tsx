import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polygon,
  useMap,
} from "react-leaflet";
import { Section, Card, CardTitle, Callout } from "../ui";
import { geo } from "../data";
import { parcels, parcelAudit as A, PARCEL_CLS } from "../parcels";

const fmt0 = (n: number) => Math.round(n).toLocaleString("en-US");

// Leaflet miscalculates size if it mounts in a hidden / zero-width container.
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t = setTimeout(fix, 250);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

// Frame the map to the parcel footprint.
function FitParcels() {
  const map = useMap();
  useEffect(() => {
    const pts = parcels.flatMap((p) => p.ring);
    if (pts.length) map.fitBounds(pts as L.LatLngBoundsLiteral, { padding: [26, 26] });
  }, [map]);
  return null;
}

// divIcons render as raw HTML outside React/Tailwind's scope, so the styles
// are inlined here (ported from the original .parcel-num / .estate-pin rules).
const numIcon = (g: number) =>
  L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:20px;height:20px;font-size:11px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(43,38,32,0.85),0 0 3px rgba(43,38,32,0.6)">${g}</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const estatePin = L.divIcon({
  className: "",
  html: `<span style="position:relative;display:block;width:30px;height:30px;border-radius:50% 50% 50% 0;background:#b4582f;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px -2px rgba(43,38,32,0.5)"><span style="position:absolute;top:9px;left:9px;width:12px;height:12px;border-radius:50%;background:#fff"></span></span>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -38],
});

export function ManiSite() {
  const { estate, fromAthens } = geo;
  const buildable = A.classBreakdown.find((c) => c.cls === "buildable")!;
  const buildablePct = (100 - A.forestReforestPct).toFixed(1);

  return (
    <div>
      <Section
        eyebrow="Surveyed footprint"
        title="The estate on the map"
        intro="All 24 registered parcels, reconstructed from the official ΕΓΣΑ87 topographic-plan vertices and colour-coded by their buildability designation. Hover a parcel for its area; click for KAEK and notes."
      >
        <Card className="!p-0 overflow-hidden">
          <MapContainer
            center={[estate.lat, estate.lon]}
            zoom={15}
            scrollWheelZoom={false}
            className="h-[480px] w-full"
          >
            <ResizeFix />
            <FitParcels />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {parcels.map((p) => (
              <Polygon
                key={p.g}
                positions={p.ring}
                pathOptions={{
                  color: PARCEL_CLS[p.cls].color,
                  weight: 1.2,
                  fillColor: PARCEL_CLS[p.cls].color,
                  fillOpacity: 0.34,
                }}
              >
                <Tooltip sticky>
                  <strong>Γ{p.g}</strong> · {p.area.toLocaleString("en-US")} m²
                  <br />
                  {PARCEL_CLS[p.cls].label}
                </Tooltip>
                <Popup>
                  <strong>Parcel Γ{p.g}</strong>
                  <br />
                  KAEK {p.kaek}
                  <br />
                  Registered: {p.area.toLocaleString("en-US")} m²
                  <br />
                  Survey check: {p.computed.toLocaleString("en-US")} m²
                  {p.note ? (
                    <>
                      <br />
                      <em>{p.note}</em>
                    </>
                  ) : null}
                </Popup>
              </Polygon>
            ))}

            {parcels.map((p) => (
              <Marker
                key={`n${p.g}`}
                position={p.centroid}
                icon={numIcon(p.g)}
                interactive={false}
              />
            ))}

            <Marker position={[estate.lat, estate.lon]} icon={estatePin}>
              <Popup>
                <strong>{estate.label}</strong>
                <br />
                {estate.coordText}
              </Popup>
            </Marker>
          </MapContainer>

          <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-stone-200/70 bg-stone-50/40">
            {Object.entries(PARCEL_CLS).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-2 text-[13px] text-stone-500">
                <span
                  className="w-3 h-3 rounded-[3px] flex-none opacity-70 ring-1 ring-inset ring-stone-800/25"
                  style={{ background: v.color }}
                />
                {v.label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-5 py-3.5 border-t border-stone-200/70 text-sm text-stone-600">
            <span
              className="w-3 h-3 rounded-full flex-none"
              style={{ background: "#b4582f", boxShadow: "0 0 0 4px rgba(180,88,47,0.18)" }}
            />
            <span>
              <strong className="text-stone-800">{estate.coordText}</strong> — {estate.label} ·{" "}
              <span className="text-stone-400">ΕΓΣΑ87 → WGS84</span>
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center flex-wrap gap-3">
            <span className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-700">
              {fromAthens.city}
            </span>
            <span className="flex-1 min-w-[80px] h-px bg-stone-200 relative">
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[11px] font-medium text-stone-400">
                {fromAthens.road}
              </span>
            </span>
            <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
              Estate
            </span>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2 text-sm text-stone-500">
            <span>{fromAthens.drive}</span>
            <span className="text-stone-300">·</span>
            <span>{fromAthens.straight}</span>
            <span className="text-stone-300">·</span>
            <span>south-west of Athens</span>
          </div>
        </Card>
      </Section>

      <Section
        eyebrow="Independent survey check"
        title="Parcel schedule & area reconciliation"
        intro="Every one of the 24 registered parcels was reconstructed from the official topographic plan's ΕΓΣΑ87 vertices, then its area was recomputed from scratch (shoelace formula) and checked against the figure stated in the deed schedule. This resolves the headline land-area discrepancy."
      >
        <Card className="border-l-4 border-l-[#4f5530] bg-gradient-to-b from-[#6b7242]/[0.08] to-white">
          <p className="text-base text-stone-700 leading-relaxed font-medium">
            The 547,000 vs 911,000 m² discrepancy resolves cleanly — both figures
            are <em>internally consistent</em>, they simply count different land.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">
            Independent reconstruction of all 24 registered parcels totals{" "}
            <strong className="text-stone-800">{fmt0(A.totalStated)} m²</strong> — within 0.1% of the
            March brochure's "Phase A core estate" figure of {fmt0(A.marchPhaseA)} m². Remove the
            single large reforestation parcel Γ2 ({fmt0(A.g2Area)} m²) and the remainder is{" "}
            <strong className="text-stone-800">{fmt0(A.statedMinusG2)} m²</strong>, matching the May
            presentation's "our land" figure of {fmt0(A.mayFigure)} m² to the square metre.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">
            The headline <strong className="text-stone-800">911,000 m²</strong> therefore requires
            ~239,000 m² of additional "Phase B" land that does <em>not</em> appear on this
            topographic plan — described in the brochure as adjoining forest. That parcel of land
            should be treated as unverified until its own title and survey are produced.
          </p>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              v: `${fmt0(A.totalStated)} m²`,
              l: "Surveyed total · 24 parcels",
              n: `vs March "Phase A" ${fmt0(A.marchPhaseA)} m²`,
            },
            {
              v: `${fmt0(A.statedMinusG2)} m²`,
              l: "Less Γ2 reforestation",
              n: `= May figure ${fmt0(A.mayFigure)} m² to the m²`,
            },
            {
              v: `${fmt0(buildable.area)} m²`,
              l: `Buildable · ${buildable.count} parcels`,
              n: `${buildablePct}% of surveyed area`,
            },
            {
              v: `${A.forestReforestPct}%`,
              l: "Forest / reforestation",
              n: `${fmt0(A.forestReforestArea)} m² restricted`,
            },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-stone-200/80 bg-amber-50/30 p-4">
              <div className="text-lg font-bold text-stone-800 tabular-nums leading-tight">
                {s.v}
              </div>
              <div className="text-sm font-medium text-stone-600 mt-1">{s.l}</div>
              <div className="text-[11px] text-stone-400 mt-0.5">{s.n}</div>
            </div>
          ))}
        </div>

        <Callout tone="warn" title="Buildability">
          Just under half the surveyed estate — {fmt0(A.forestReforestArea)} m² ({A.forestReforestPct}%) —
          carries a forest (δασική) or reforestation (αναδασωτέα) designation: parcel Γ19 entirely,
          plus parts of Γ2 and Γ18. These are effectively non-buildable and constrain where the 52
          keys can actually be placed.
        </Callout>

        <Card>
          <CardTitle em={`${A.parcelCount} plots`}>Parcel schedule</CardTitle>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-200">
                  <th className="text-left font-semibold px-2 py-2">Parcel</th>
                  <th className="text-left font-semibold px-2 py-2">KAEK</th>
                  <th className="text-left font-semibold px-2 py-2">Designation</th>
                  <th className="text-right font-semibold px-2 py-2">Registered m²</th>
                  <th className="text-right font-semibold px-2 py-2">Survey ✓ m²</th>
                  <th className="text-right font-semibold px-2 py-2">Δ</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((p) => {
                  const diff = ((p.computed - p.area) / p.area) * 100;
                  const diffColor = Math.abs(diff) < 5 ? "text-stone-500" : "text-amber-700";
                  return (
                    <tr key={p.g} className="border-b border-stone-100">
                      <td className="px-2 py-1.5 font-semibold text-stone-700">Γ{p.g}</td>
                      <td className="px-2 py-1.5 text-stone-500 tabular-nums text-xs">{p.kaek}</td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1.5 text-stone-600">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-none"
                            style={{ background: PARCEL_CLS[p.cls].color }}
                          />
                          {PARCEL_CLS[p.cls].short}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-stone-700">
                        {fmt0(p.area)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-stone-700">
                        {fmt0(p.computed)}
                      </td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${diffColor}`}>
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-stone-800 border-t-2 border-stone-200">
                  <td className="px-2 py-2" colSpan={3}>
                    Total · {A.parcelCount} parcels
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt0(A.totalStated)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt0(A.totalComputed)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    +{A.computedDiffPct.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[12px] text-stone-400 leading-relaxed mt-4">
            Survey column is an independent shoelace area from the reconstructed ΕΓΣΑ87 polygon — not
            copied from the deed. {A.within5pct} of {A.parcelCount} parcels agree within 5% and{" "}
            {A.within11pct} within 11%; the aggregate is +{A.computedDiffPct.toFixed(1)}%. Larger
            per-row percentages occur only on small or elongated slivers, where the shoelace area is
            geometrically hypersensitive to a single vertex — the absolute deviations stay small and
            self-cancel across the estate.
          </p>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <figure className="m-0">
            <img
              src="/mani/topo-plan.jpg"
              alt="Official ΕΓΣΑ87 topographic plan of the Mavromichali estate showing all 24 numbered parcels"
              loading="lazy"
              className="block w-full h-auto border-b border-stone-200"
            />
            <figcaption className="px-5 py-3 text-[12.5px] text-stone-500 leading-relaxed">
              <strong className="text-stone-700 font-semibold">Source exhibit —</strong> official
              topographic plan, θέση «Πασσαβάς» Αγ. Βασιλείου, Δ. Γυθείου (Sept 2014, scale 1:1000).
              The map and schedule above are reconstructed directly from this drawing's vertex
              coordinates, transformed ΕΓΣΑ87 → WGS84.
            </figcaption>
          </figure>
        </Card>
      </Section>
    </div>
  );
}
