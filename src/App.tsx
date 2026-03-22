import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PasswordGate } from "./components/PasswordGate";
import { Layout } from "./components/Layout";
import type { ViewName } from "./components/Sidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const SESSION_KEY = "olive-press-authenticated";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const VIEW_LABELS: Record<ViewName, string> = {
  overview: "Project Overview",
  timeline: "Timeline",
  budget: "Budget Tracker",
  documents: "Documents",
  risks: "Risk Register",
  team: "Team Directory",
  gallery: "Photo Gallery",
};

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [authError, setAuthError] = useState<string>();
  const [activeView, setActiveView] = useState<ViewName>("overview");

  const handleAuthenticate = useCallback(async (password: string) => {
    const expectedHash = import.meta.env.VITE_APP_PASSWORD_HASH;
    if (!expectedHash) {
      setAuthError("Password hash not configured");
      return;
    }

    const hash = await hashPassword(password);
    if (hash === expectedHash) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeView={activeView} onNavigate={setActiveView}>
        <div>
          <h2 className="text-2xl font-bold text-stone-800 mb-4">
            {VIEW_LABELS[activeView]}
          </h2>
          <p className="text-stone-500">Coming soon.</p>
        </div>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
