import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throwing here would crash the whole SPA at import time (registry eagerly pulls
// in the Olive Press views), taking down every other project's dashboard too.
// Degrade instead: only Olive Press live-data views are affected when unconfigured.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — Olive Press live data is disabled.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "public-anon-key",
);
