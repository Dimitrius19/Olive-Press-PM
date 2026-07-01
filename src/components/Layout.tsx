import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { ProjectDef } from "../projects/types";

interface LayoutProps {
  project: ProjectDef;
  activeView: string;
  onNavigate: (view: string) => void;
  onBackToPortfolio: () => void;
  children: ReactNode;
}

export function Layout({
  project,
  activeView,
  onNavigate,
  onBackToPortfolio,
  children,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        project={project}
        activeView={activeView}
        onNavigate={onNavigate}
        onBackToPortfolio={onBackToPortfolio}
      />
      <main className="flex-1 bg-stone-50 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
