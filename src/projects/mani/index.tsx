import { LayoutDashboard, Map, Coins, TrendingUp, AlertTriangle, ShieldAlert } from "lucide-react";
import type { ProjectDef } from "../types";
import { project as mani, kpis } from "./data";
import { ManiOverview } from "./views/ManiOverview";
import { ManiSite } from "./views/ManiSite";
import { ManiFinancials } from "./views/ManiFinancials";
import { ManiMarketCheck } from "./views/ManiMarketCheck";
import { ManiRisks } from "./views/ManiRisks";
import { ManiDueDiligence } from "./views/ManiDueDiligence";

export const maniProject: ProjectDef = {
  id: "mani",
  name: mani.name,
  shortName: "Mani Estate",
  location: mani.location,
  tagline: mani.tagline,
  stage: "Pre-investment study",
  status: "Due diligence",
  accent: "amber",
  sidebarBg: "#2b211a",
  cover: "/mani/topo-plan.jpg",
  kpis: [
    { label: "Land area", value: kpis[0].value + " " + kpis[0].unit },
    { label: "Planned keys", value: kpis[1].value },
    { label: "Dev. capex", value: kpis[2].value },
    { label: "Equity offered", value: kpis[3].value },
  ],
  nav: [
    { key: "overview", label: "Overview", icon: LayoutDashboard, component: ManiOverview },
    { key: "site", label: "Site & Parcels", icon: Map, component: ManiSite },
    { key: "financials", label: "Financials", icon: Coins, component: ManiFinancials },
    { key: "market", label: "Market Check", icon: TrendingUp, component: ManiMarketCheck },
    { key: "risks", label: "Risks", icon: AlertTriangle, component: ManiRisks },
    { key: "dd", label: "Due Diligence", icon: ShieldAlert, component: ManiDueDiligence },
  ],
};
