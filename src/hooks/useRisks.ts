import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { Risk } from "../lib/types.ts";

export async function fetchRisks(): Promise<Risk[]> {
  const { data, error } = await supabase
    .from("risks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Risk[];
}

export async function createRisk(
  risk: Omit<Risk, "id" | "created_at" | "resolved_at">,
): Promise<Risk> {
  const { data, error } = await supabase
    .from("risks")
    .insert(risk)
    .select()
    .single();

  if (error) throw error;
  return data as Risk;
}

export async function updateRisk(
  id: string,
  updates: Partial<Omit<Risk, "id" | "created_at">>,
): Promise<Risk> {
  const payload = { ...updates };

  if (updates.status === "resolved" && !updates.resolved_at) {
    payload.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("risks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Risk;
}

export function useRisks() {
  return useQuery<Risk[]>({
    queryKey: ["risks"],
    queryFn: fetchRisks,
  });
}

export function useCreateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (risk: Parameters<typeof createRisk>[0]) => createRisk(risk),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

export function useUpdateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateRisk>[1] }) =>
      updateRisk(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}
