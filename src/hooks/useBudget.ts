import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { BudgetCategory, BudgetLine } from "../lib/types.ts";

export async function fetchBudgetCategories(): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data as BudgetCategory[];
}

export async function fetchBudgetLines(): Promise<BudgetLine[]> {
  const { data, error } = await supabase
    .from("budget_lines")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data as BudgetLine[];
}

export async function updateBudgetLine(
  id: string,
  updates: Partial<Pick<BudgetLine, "actual_amount" | "notes">>,
): Promise<BudgetLine> {
  const { data, error } = await supabase
    .from("budget_lines")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as BudgetLine;
}

export function useBudgetCategories() {
  return useQuery<BudgetCategory[]>({
    queryKey: ["budget_categories"],
    queryFn: fetchBudgetCategories,
  });
}

export function useBudgetLines() {
  return useQuery<BudgetLine[]>({
    queryKey: ["budget_lines"],
    queryFn: fetchBudgetLines,
  });
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateBudgetLine>[1] }) =>
      updateBudgetLine(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budget_lines"] });
    },
  });
}
