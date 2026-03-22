import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { TeamMember } from "../lib/types.ts";

export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data as TeamMember[];
}

export async function createTeamMember(
  member: Omit<TeamMember, "id" | "created_at">,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from("team_members")
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
}

export async function updateTeamMember(
  id: string,
  updates: Partial<Omit<TeamMember, "id" | "created_at">>,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from("team_members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: Parameters<typeof createTeamMember>[0]) =>
      createTeamMember(member),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof updateTeamMember>[1];
    }) => updateTeamMember(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}
