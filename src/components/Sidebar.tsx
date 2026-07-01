import { LayoutGrid } from "lucide-react";
import type { AccentKey, ProjectDef } from "../projects/types";

// Accent class strings are written out in full so the Tailwind JIT scanner
// picks them up (it cannot see dynamically composed class names).
const ACCENT: Record<
  AccentKey,
  { activeBtn: string; hoverBtn: string; activeIcon: string; subtitle: string; footer: string; mark: string }
> = {
  emerald: {
    activeBtn: "bg-emerald-800/50 text-emerald-100",
    hoverBtn: "hover:bg-emerald-900/30 hover:text-white",
    activeIcon: "text-emerald-300",
    subtitle: "text-emerald-400",
    footer: "text-emerald-600/60",
    mark: "bg-emerald-500/20 text-emerald-200",
  },
  sky: {
    activeBtn: "bg-sky-800/50 text-sky-100",
    hoverBtn: "hover:bg-sky-900/30 hover:text-white",
    activeIcon: "text-sky-300",
    subtitle: "text-sky-400",
    footer: "text-sky-600/60",
    mark: "bg-sky-500/20 text-sky-200",
  },
  amber: {
    activeBtn: "bg-amber-800/50 text-amber-100",
    hoverBtn: "hover:bg-amber-900/30 hover:text-white",
    activeIcon: "text-amber-300",
    subtitle: "text-amber-400",
    footer: "text-amber-600/60",
    mark: "bg-amber-500/20 text-amber-200",
  },
  orange: {
    activeBtn: "bg-orange-800/50 text-orange-100",
    hoverBtn: "hover:bg-orange-900/30 hover:text-white",
    activeIcon: "text-orange-300",
    subtitle: "text-orange-400",
    footer: "text-orange-600/60",
    mark: "bg-orange-500/20 text-orange-200",
  },
  violet: {
    activeBtn: "bg-violet-800/50 text-violet-100",
    hoverBtn: "hover:bg-violet-900/30 hover:text-white",
    activeIcon: "text-violet-300",
    subtitle: "text-violet-400",
    footer: "text-violet-600/60",
    mark: "bg-violet-500/20 text-violet-200",
  },
  rose: {
    activeBtn: "bg-rose-800/50 text-rose-100",
    hoverBtn: "hover:bg-rose-900/30 hover:text-white",
    activeIcon: "text-rose-300",
    subtitle: "text-rose-400",
    footer: "text-rose-600/60",
    mark: "bg-rose-500/20 text-rose-200",
  },
  teal: {
    activeBtn: "bg-teal-800/50 text-teal-100",
    hoverBtn: "hover:bg-teal-900/30 hover:text-white",
    activeIcon: "text-teal-300",
    subtitle: "text-teal-400",
    footer: "text-teal-600/60",
    mark: "bg-teal-500/20 text-teal-200",
  },
  indigo: {
    activeBtn: "bg-indigo-800/50 text-indigo-100",
    hoverBtn: "hover:bg-indigo-900/30 hover:text-white",
    activeIcon: "text-indigo-300",
    subtitle: "text-indigo-400",
    footer: "text-indigo-600/60",
    mark: "bg-indigo-500/20 text-indigo-200",
  },
};

interface SidebarProps {
  project: ProjectDef;
  activeView: string;
  onNavigate: (view: string) => void;
  onBackToPortfolio: () => void;
}

export function Sidebar({ project, activeView, onNavigate, onBackToPortfolio }: SidebarProps) {
  const accent = ACCENT[project.accent];

  return (
    <aside
      className="w-64 text-stone-300 flex flex-col h-screen sticky top-0 shrink-0 overflow-y-auto"
      style={{ backgroundColor: project.sidebarBg }}
    >
      <div className="p-6">
        <button
          onClick={onBackToPortfolio}
          className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors mb-5"
        >
          <LayoutGrid size={13} />
          All projects
        </button>
        <div className="flex items-center gap-2.5">
          {project.logo ? (
            <img
              src={project.logo}
              alt={project.shortName}
              className="w-8 h-8 rounded-full bg-white/10 p-0.5"
            />
          ) : (
            <span
              className={`w-8 h-8 rounded-lg grid place-items-center text-sm font-bold ${accent.mark}`}
            >
              {project.shortName.charAt(0)}
            </span>
          )}
          <h1 className="text-lg font-bold text-white/95 tracking-tight leading-tight">
            {project.shortName}
          </h1>
        </div>
        <p className={`text-xs mt-1 ml-[42px] ${accent.subtitle}`}>{project.location}</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {project.nav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? accent.activeBtn : accent.hoverBtn
                  }`}
                >
                  <Icon size={18} className={isActive ? accent.activeIcon : "text-stone-500"} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className={`text-[10px] text-center ${accent.footer}`}>{project.name}</p>
      </div>
    </aside>
  );
}
