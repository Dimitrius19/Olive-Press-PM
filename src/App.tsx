import { useState, useCallback, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PasswordGate } from "./components/PasswordGate";
import { Layout } from "./components/Layout";
import type { ViewName } from "./components/Sidebar";
import { Overview } from "./views/Overview";
import { Timeline } from "./views/Timeline";
import { Budget } from "./views/Budget";
import { Documents } from "./views/Documents";
import { Risks } from "./views/Risks";
import { Team } from "./views/Team";
import { Gallery } from "./views/Gallery";
import { MarketCheck } from "./views/MarketCheck";
import { FinancialModel } from "./views/FinancialModel";
import { SitePlan } from "./views/SitePlan";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const SESSION_KEY = "olive-press-authenticated";
const APP_PASSWORD = "olive-press-2026";

const viewComponents: Record<ViewName, ComponentType> = {
  overview: Overview,
  timeline: Timeline,
  budget: Budget,
  documents: Documents,
  risks: Risks,
  team: Team,
  gallery: Gallery,
  siteplan: SitePlan,
  market: MarketCheck,
  financial: FinancialModel,
};

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [authError, setAuthError] = useState<string>();
  const [activeView, setActiveView] = useState<ViewName>("overview");

  const handleAuthenticate = useCallback((password: string) => {
    if (password === APP_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      setAuthError(undefined);
    } else {
      setAuthError("Invalid password");
    }
  }, []);

  if (!authenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticate} error={authError} />;
  }

  const ActiveComponent = viewComponents[activeView];

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeView={activeView} onNavigate={setActiveView}>
        <ActiveComponent />
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
