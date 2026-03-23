import { useState, useRef, useCallback, useEffect } from "react";
import {
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Building2,
  Trees,
  Waves,
  Wrench,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MapAnnotation {
  id: string;
  label: string;
  description: string;
  x: number; // % from left
  y: number; // % from top
  category: "building" | "outdoor" | "amenity" | "infrastructure";
  details: string[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const ANNOTATIONS: MapAnnotation[] = [
  {
    id: "op1-main",
    label: "Olive Press I — Main Building",
    description: "36-room heritage stone building, 2 stories, 73m × 24m",
    x: 18,
    y: 40,
    category: "building",
    details: [
      "Ground floor: 15 double, 11 triple, 1 suite",
      "Upper floor: 2 double, 4 triple, 3 suites",
      "Stone masonry walls 50-65cm thick",
      "Timber roof with Byzantine ceramic tiles",
      "22m heritage chimney",
      "Internal courtyard with preserved kiln",
    ],
  },
  {
    id: "reception",
    label: "New Reception & Entrance",
    description: "New entrance hall and reception area",
    x: 12,
    y: 35,
    category: "building",
    details: ["~80 m² new reception area", "Main guest entrance"],
  },
  {
    id: "restaurant",
    label: "Elia Restaurant",
    description: "Beachfront restaurant renovation",
    x: 25,
    y: 55,
    category: "building",
    details: [
      "~150 m² restaurant area",
      "Beachfront dining",
      "Full kitchen renovation",
    ],
  },
  {
    id: "pool",
    label: "Swimming Pool",
    description: "Hotel pool with Molyvos castle view",
    x: 35,
    y: 35,
    category: "amenity",
    details: [
      "~200 m² pool basin",
      "~300 m² pool deck",
      "Filtration & solar heating",
      "Changing rooms",
    ],
  },
  {
    id: "courtyard",
    label: "Internal Courtyard",
    description: "Preserved courtyard with historic kiln/chimney",
    x: 20,
    y: 45,
    category: "outdoor",
    details: [
      "Historic olive press kiln",
      "22m chimney landmark",
      "Stone paved courtyard",
    ],
  },
  {
    id: "beach",
    label: "Beach & Seafront",
    description: "Pebble beach with sun beds and floating platforms",
    x: 30,
    y: 70,
    category: "outdoor",
    details: ["Sun beds & umbrellas", "Floating platforms", "Beach access steps"],
  },
  {
    id: "surrounding",
    label: "Surrounding Area & Landscaping",
    description: "6,658 m² outdoor area with amenities",
    x: 50,
    y: 40,
    category: "outdoor",
    details: [
      "Beach volley court",
      "Yoga kiosk",
      "Outdoor gym",
      "Water feature",
      "Kiosk cabins",
      "Pergolas",
      "Landscaping & irrigation",
    ],
  },
  {
    id: "op2",
    label: "Olive Press II — Studio Apartments",
    description: "12 studio apartments, neighboring plot",
    x: 75,
    y: 35,
    category: "building",
    details: [
      "587 m² built area, 2-story concrete building",
      "14 rentable rooms / 12 studio units",
      "Basement: auxiliary H/M facilities",
      "Plot: 6,208 m² (KAEK 330511503002)",
      "No structural reinforcement needed",
    ],
  },
  {
    id: "pier",
    label: "Pier / Jetty",
    description: "Existing waterfront pier",
    x: 8,
    y: 60,
    category: "infrastructure",
    details: ["Existing structure", "Potential for boat access"],
  },
];

const CATEGORY_CONFIG: Record<
  MapAnnotation["category"],
  { color: string; bg: string; border: string; pulse: string; label: string; icon: typeof Building2 }
> = {
  building: {
    color: "text-emerald-400",
    bg: "bg-emerald-500",
    border: "border-emerald-500/60",
    pulse: "bg-emerald-400/40",
    label: "Buildings",
    icon: Building2,
  },
  outdoor: {
    color: "text-amber-400",
    bg: "bg-amber-500",
    border: "border-amber-500/60",
    pulse: "bg-amber-400/40",
    label: "Outdoor Areas",
    icon: Trees,
  },
  amenity: {
    color: "text-blue-400",
    bg: "bg-blue-500",
    border: "border-blue-500/60",
    pulse: "bg-blue-400/40",
    label: "Amenities",
    icon: Waves,
  },
  infrastructure: {
    color: "text-stone-400",
    bg: "bg-stone-400",
    border: "border-stone-400/60",
    pulse: "bg-stone-400/40",
    label: "Infrastructure",
    icon: Wrench,
  },
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SitePlan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [hdLoaded, setHdLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Preload HD image when zoom crosses 2x
  useEffect(() => {
    if (scale > 2 && !hdLoaded) {
      const img = new Image();
      img.onload = () => setHdLoaded(true);
      img.src = "/masterplan-hd.png";
    }
  }, [scale, hdLoaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
      } else if (e.key === "-") {
        e.preventDefault();
        setScale((s) => Math.max(MIN_SCALE, s - ZOOM_STEP));
      } else if (e.key === "0") {
        e.preventDefault();
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === "Escape") {
        setActiveAnnotation(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* --- Pan handlers --- */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* --- Zoom handler (wheel) --- */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  }, []);

  /* --- Touch handlers --- */
  const lastTouchDistance = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    },
    [position],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = (dist - lastTouchDistance.current) * 0.005;
        lastTouchDistance.current = dist;
        setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
      } else if (e.touches.length === 1 && isDragging) {
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = null;
  }, []);

  /* --- Zoom to annotation --- */
  const zoomToAnnotation = useCallback(
    (annotation: MapAnnotation) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const targetScale = 2.5;
      const imgWidth = imgRef.current?.naturalWidth ?? rect.width;
      const imgHeight = imgRef.current?.naturalHeight ?? rect.height;

      // Compute displayed image size at target scale
      const displayedWidth = imgWidth * targetScale;
      const displayedHeight = imgHeight * targetScale;

      // Annotation position in displayed coordinates (from center of image)
      const annX = (annotation.x / 100) * displayedWidth;
      const annY = (annotation.y / 100) * displayedHeight;

      // We want the annotation to be in the center of the viewport
      // The image transform origin is center, so translate(0,0) means image center is at container center
      // At translate(0,0), the top-left of the image is at (containerCenter - displayedWidth/2, containerCenter - displayedHeight/2)
      // The annotation is at (topLeft + annX, topLeft + annY) in viewport coords
      // We want that to equal (rect.width/2, rect.height/2)

      const offsetX = rect.width / 2 - (annX - displayedWidth / 2 + rect.width / 2);
      const offsetY = rect.height / 2 - (annY - displayedHeight / 2 + rect.height / 2);

      setScale(targetScale);
      setPosition({ x: offsetX, y: offsetY });
      setActiveAnnotation(annotation.id);
    },
    [],
  );

  /* --- Zoom controls --- */
  const zoomIn = useCallback(
    () => setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP)),
    [],
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(MIN_SCALE, s - ZOOM_STEP)),
    [],
  );
  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setActiveAnnotation(null);
  }, []);

  const useHd = scale > 2 && hdLoaded;

  /* --- Grouped annotations for sidebar --- */
  const grouped = ANNOTATIONS.reduce(
    (acc, ann) => {
      if (!acc[ann.category]) acc[ann.category] = [];
      acc[ann.category].push(ann);
      return acc;
    },
    {} as Record<string, MapAnnotation[]>,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Map size={20} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">Site Masterplan</h2>
            <p className="text-xs text-stone-500">
              Olive Press Hotel — Molyvos, Lesvos (Drawing: June 2022)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
            title="Reset view (0)"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sidebarOpen
                ? "bg-emerald-100 text-emerald-700"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {sidebarOpen ? "Hide Legend" : "Show Legend"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map container */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-stone-900 overflow-hidden select-none"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image + annotations wrapper */}
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{ touchAction: "none" }}
          >
            <div
              className="relative"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : undefined,
              }}
            >
              <img
                ref={imgRef}
                src={useHd ? "/masterplan-hd.png" : "/masterplan.png"}
                alt="Olive Press Hotel Site Masterplan"
                className="max-w-none select-none pointer-events-none"
                draggable={false}
                style={{ display: "block" }}
              />

              {/* Annotation markers */}
              {ANNOTATIONS.map((ann) => {
                const cfg = CATEGORY_CONFIG[ann.category];
                const isActive = activeAnnotation === ann.id;
                return (
                  <button
                    key={ann.id}
                    className="absolute group"
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: `translate(-50%, -50%) scale(${1 / scale})`,
                      zIndex: isActive ? 50 : 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnnotation(isActive ? null : ann.id);
                    }}
                  >
                    {/* Pulse ring */}
                    <span
                      className={`absolute inset-0 rounded-full ${cfg.pulse} animate-ping`}
                      style={{ width: 20, height: 20, margin: "auto" }}
                    />
                    {/* Dot */}
                    <span
                      className={`relative block w-5 h-5 rounded-full ${cfg.bg} border-2 border-white shadow-lg shadow-black/30`}
                    />

                    {/* Popup card */}
                    {isActive && (
                      <div
                        className="absolute z-50 w-72 bg-stone-800/95 backdrop-blur-sm border border-stone-600/50 rounded-xl shadow-2xl text-left"
                        style={{
                          bottom: "calc(100% + 12px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} text-white mb-2`}
                              >
                                {ann.category}
                              </span>
                              <h3 className="text-sm font-bold text-white leading-tight">
                                {ann.label}
                              </h3>
                              <p className="text-xs text-stone-400 mt-1">
                                {ann.description}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAnnotation(null);
                              }}
                              className="p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-stone-300 transition-colors shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <ul className="mt-3 space-y-1">
                            {ann.details.map((d, i) => (
                              <li
                                key={i}
                                className="text-xs text-stone-300 flex items-start gap-2"
                              >
                                <span className={`mt-1.5 w-1 h-1 rounded-full ${cfg.bg} shrink-0`} />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Arrow */}
                        <div
                          className="absolute left-1/2 -bottom-2 w-4 h-4 bg-stone-800/95 border-r border-b border-stone-600/50 rotate-45"
                          style={{ transform: "translateX(-50%) rotate(45deg)" }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom indicator overlay */}
          {scale !== 1 && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-mono">
              {Math.round(scale * 100)}%
              {useHd && (
                <span className="ml-2 text-emerald-400 text-[10px]">HD</span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        {sidebarOpen && (
          <div className="w-80 bg-stone-800/95 backdrop-blur-sm border-l border-stone-700/50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-bold text-white mb-4">
                Areas & Annotations
              </h3>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-stone-700/50">
                {(
                  Object.entries(CATEGORY_CONFIG) as [
                    MapAnnotation["category"],
                    (typeof CATEGORY_CONFIG)[MapAnnotation["category"]],
                  ][]
                ).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`}
                      />
                      <Icon size={12} className={cfg.color} />
                      <span className="text-[10px] text-stone-400 capitalize">
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grouped list */}
              {(
                Object.entries(CATEGORY_CONFIG) as [
                  MapAnnotation["category"],
                  (typeof CATEGORY_CONFIG)[MapAnnotation["category"]],
                ][]
              ).map(([category, cfg]) => {
                const items = grouped[category];
                if (!items?.length) return null;
                const Icon = cfg.icon;
                return (
                  <div key={category} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className={cfg.color} />
                      <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                        {cfg.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.map((ann) => {
                        const isActive = activeAnnotation === ann.id;
                        return (
                          <button
                            key={ann.id}
                            onClick={() => zoomToAnnotation(ann)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                              isActive
                                ? `bg-stone-700 ${cfg.border} border`
                                : "hover:bg-stone-700/50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${cfg.bg} shrink-0`}
                              />
                              <span
                                className={`font-medium ${isActive ? "text-white" : "text-stone-300"}`}
                              >
                                {ann.label}
                              </span>
                            </div>
                            <p className="text-stone-500 mt-0.5 ml-4 leading-snug">
                              {ann.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keyboard shortcuts help */}
            <div className="p-4 border-t border-stone-700/50">
              <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider mb-2">
                Keyboard Shortcuts
              </p>
              <div className="space-y-1 text-[11px] text-stone-500">
                <div className="flex justify-between">
                  <span>Zoom in / out</span>
                  <span className="font-mono text-stone-600">+ / -</span>
                </div>
                <div className="flex justify-between">
                  <span>Reset view</span>
                  <span className="font-mono text-stone-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Close popup</span>
                  <span className="font-mono text-stone-600">Esc</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
