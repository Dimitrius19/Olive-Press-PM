import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Section, Card, Callout, Stat } from "../ui";
import { useCase, ACCENT_HEX } from "../context";

// Leaflet miscalculates size when it mounts in a hidden / zero-width container.
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

// Teardrop pin, coloured per accent. divIcons render as raw HTML outside the
// Tailwind tree, so styles are inlined.
const makePin = (hex: string) =>
  L.divIcon({
    className: "",
    html: `<span style="position:relative;display:block;width:30px;height:30px;border-radius:50% 50% 50% 0;background:${hex};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px -2px rgba(28,25,23,0.5)"><span style="position:absolute;top:9px;left:9px;width:12px;height:12px;border-radius:50%;background:#fff"></span></span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });

export function CaseProperty() {
  const c = useCase();
  const pin = makePin(ACCENT_HEX[c.accent]);

  return (
    <div>
      <Section
        eyebrow="Where it is"
        title="Property & location"
        intro={c.address}
      >
        <Card className="!p-0 overflow-hidden">
          <MapContainer
            center={[c.coords.lat, c.coords.lon]}
            zoom={16}
            scrollWheelZoom={false}
            className="h-[420px] w-full"
          >
            <ResizeFix />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[c.coords.lat, c.coords.lon]} icon={pin}>
              <Popup>
                <strong>{c.shortName}</strong>
                <br />
                {c.address}
              </Popup>
            </Marker>
          </MapContainer>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-stone-200/70 text-sm text-stone-600">
            <span className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full flex-none"
                style={{ background: ACCENT_HEX[c.accent], boxShadow: `0 0 0 4px ${ACCENT_HEX[c.accent]}2e` }}
              />
              <span>
                <strong className="text-stone-800">{c.address}</strong>
                {c.coords.approximate && (
                  <span className="text-stone-400"> · pin is approximate</span>
                )}
              </span>
            </span>
            {c.mapsLink && (
              <a
                href={c.mapsLink}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
              >
                Open in Google Maps
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Card>

        {c.coords.approximate && (
          <Callout tone="info" title="Map note">
            The marker is placed from the address for orientation only; the authoritative location is
            the Google Maps link and the cadastral KAEK references below.
          </Callout>
        )}
      </Section>

      <Section
        eyebrow="The asset"
        title="Property facts"
        intro="Headline physical and planning parameters as stated in the teaser."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {c.facts.map((f) => (
            <Stat key={f.label} value={f.value} label={f.label} note={f.note} />
          ))}
        </div>
      </Section>

      {c.kaek && c.kaek.length > 0 && (
        <Section eyebrow="Cadastre" title="Land registry (KAEK)">
          <Card>
            <div className="divide-y divide-stone-100">
              {c.kaek.map((k) => (
                <div key={k.code} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-stone-800 tabular-nums">
                      {k.code}
                    </span>
                    {k.note && (
                      <span className="block text-[12px] text-stone-500 mt-0.5">{k.note}</span>
                    )}
                  </div>
                  {k.area && (
                    <span className="text-sm font-medium text-stone-600 tabular-nums whitespace-nowrap">
                      {k.area}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {c.feks && c.feks.length > 0 && (
        <Section
          eyebrow="Urban planning & legal"
          title="Governing instruments"
          intro="The Government Gazette (ΦΕΚ), decrees and ministerial decisions that fix the site's permitted uses, building ratio and protection regime."
        >
          <Card>
            <ol className="relative border-l border-stone-200 ml-2 space-y-5">
              {c.feks.map((f) => (
                <li key={f.ref} className="ml-5">
                  <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-white border-2 border-stone-300" />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-sm font-bold text-stone-800">{f.ref}</span>
                    {f.date && <span className="text-[12px] text-stone-400">{f.date}</span>}
                  </div>
                  <p className="text-[13px] text-stone-600 leading-relaxed mt-1">{f.summary}</p>
                </li>
              ))}
            </ol>
            {c.legalNote && (
              <div className="mt-5">
                <Callout tone="warn" title="Legal note">
                  {c.legalNote}
                </Callout>
              </div>
            )}
          </Card>
        </Section>
      )}
    </div>
  );
}
