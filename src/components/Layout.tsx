import type { ReactNode } from "react";
import { Sidebar, type ViewName } from "./Sidebar";

interface LayoutProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  children: ReactNode;
}

export function Layout({ activeView, onNavigate, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onNavigate={onNavigate} />
      <main className="flex-1 bg-stone-50 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
