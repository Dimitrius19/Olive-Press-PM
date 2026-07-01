import { useState } from "react";
import { Layout } from "./Layout";
import type { ProjectDef } from "../projects/types";

interface ProjectWorkspaceProps {
  project: ProjectDef;
  onBackToPortfolio: () => void;
}

export function ProjectWorkspace({ project, onBackToPortfolio }: ProjectWorkspaceProps) {
  const [activeKey, setActiveKey] = useState(project.nav[0].key);
  const active = project.nav.find((n) => n.key === activeKey) ?? project.nav[0];
  const ActiveComponent = active.component;
  const content = <ActiveComponent />;

  return (
    <Layout
      project={project}
      activeView={active.key}
      onNavigate={setActiveKey}
      onBackToPortfolio={onBackToPortfolio}
    >
      {project.Wrapper ? <project.Wrapper>{content}</project.Wrapper> : content}
    </Layout>
  );
}
