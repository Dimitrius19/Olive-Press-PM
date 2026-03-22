import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase.ts";
import type { Document } from "../lib/types.ts";

export async function fetchDocuments(
  category?: Document["category"],
): Promise<Document[]> {
  let query = supabase.from("documents").select("*");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;
  return data as Document[];
}

export async function uploadDocument(
  file: File,
  meta: Pick<Document, "title" | "category" | "uploaded_by" | "tags">,
): Promise<Document> {
  const filePath = `${meta.category}/${Date.now()}_${file.name}`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (storageError) throw storageError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: meta.title,
      category: meta.category,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: meta.uploaded_by,
      tags: meta.tags,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(
  id: string,
  filePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([filePath]);

  if (storageError) throw storageError;

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) throw error;
}

export function useDocuments(category?: Document["category"]) {
  return useQuery<Document[]>({
    queryKey: ["documents", category ?? "all"],
    queryFn: () => fetchDocuments(category),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      meta,
    }: {
      file: File;
      meta: Parameters<typeof uploadDocument>[1];
    }) => uploadDocument(file, meta),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
