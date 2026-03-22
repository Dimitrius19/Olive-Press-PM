import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { ActivityLogEntry } from "../lib/types.ts";

export async function fetchActivityLog(
  limit = 20,
): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ActivityLogEntry[];
}

export function useActivityLog(limit = 20) {
  return useQuery<ActivityLogEntry[]>({
    queryKey: ["activity_log", limit],
    queryFn: () => fetchActivityLog(limit),
  });
}
