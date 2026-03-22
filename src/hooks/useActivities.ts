import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { Activity } from "../lib/types.ts";

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("number");

  if (error) throw error;
  return data as Activity[];
}

export async function updateActivity(
  id: string,
  updates: Partial<
    Pick<
      Activity,
      | "status"
      | "progress_pct"
      | "assigned_to"
      | "start_date"
      | "end_date"
      | "notes"
    >
  >,
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export function useActivities() {
  return useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateActivity>[1] }) =>
      updateActivity(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
