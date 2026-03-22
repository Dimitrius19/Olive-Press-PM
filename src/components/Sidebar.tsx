import {
  LayoutDashboard,
  GanttChart,
  Wallet,
  FileText,
  AlertTriangle,
  Users,
  Image,
  Leaf,
  type LucideIcon,
} from "lucide-react";

export type ViewName =
  | "overview"
  | "timeline"
  | "budget"
  | "documents"
  | "risks"
  | "team"
  | "gallery";

interface NavItem {
  key: ViewName;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "timeline", label: "Timeline", icon: GanttChart },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "risks", label: "Risks", icon: AlertTriangle },
  { key: "team", label: "Team", icon: Users },
  { key: "gallery", label: "Gallery", icon: Image },
];

interface SidebarProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#1a2e1a] text-stone-300 flex flex-col min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Leaf size={20} className="text-emerald-400" />
          <h1 className="text-lg font-bold text-white/95 tracking-tight">
            Olive Press
          </h1>
        </div>
        <p className="text-xs text-emerald-400 mt-1 ml-7">Molyvos, Lesvos</p>
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-800/50 text-emerald-100"
                      : "hover:bg-emerald-900/30 hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-emerald-300" : "text-stone-500"}
                  />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-emerald-600/50 text-center">
          Molyvos, Lesvos — Greece
        </p>
      </div>
    </aside>
  );
}
