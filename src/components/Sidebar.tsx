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
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: "\u{1F3E0}" },
  { key: "timeline", label: "Timeline", icon: "\u{1F4C5}" },
  { key: "budget", label: "Budget", icon: "\u{1F4B0}" },
  { key: "documents", label: "Documents", icon: "\u{1F4C4}" },
  { key: "risks", label: "Risks", icon: "\u{26A0}\uFE0F" },
  { key: "team", label: "Team", icon: "\u{1F465}" },
  { key: "gallery", label: "Gallery", icon: "\u{1F5BC}\uFE0F" },
];

interface SidebarProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-lg font-bold text-white">Olive Press</h1>
        <p className="text-xs text-stone-500">Project Management</p>
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeView === item.key
                    ? "bg-stone-700 text-white"
                    : "hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
