import {
  LayoutDashboard,
  GanttChart,
  Wallet,
  FileText,
  AlertTriangle,
  Users,
  Image,
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
        <h1 className="text-lg font-bold text-white tracking-tight">
          Olive Press
        </h1>
        <p className="text-xs text-emerald-400/60">Project Management</p>
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
      <div className="p-4 border-t border-emerald-900/40">
        <p className="text-[10px] text-stone-600 text-center">
          Molyvos, Lesvos
        </p>
      </div>
    </aside>
  );
}
