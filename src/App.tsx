import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PasswordGate } from "./components/PasswordGate";
import { PortfolioLanding } from "./components/PortfolioLanding";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { getProject } from "./projects/registry";

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

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [authError, setAuthError] = useState<string>();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

  const project = activeProjectId ? getProject(activeProjectId) : undefined;

  return (
    <QueryClientProvider client={queryClient}>
      {project ? (
        <ProjectWorkspace
          key={project.id}
          project={project}
          onBackToPortfolio={() => setActiveProjectId(null)}
        />
      ) : (
        <PortfolioLanding onOpenProject={setActiveProjectId} />
      )}
    </QueryClientProvider>
  );
}

export default App;
