import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export type ProjectSummary = { id: string; name: string; created_by: string | null };

// Sidebar ve formlar için proje listesi (istek başına tek sorgu)
export const getProjects = cache(async (): Promise<ProjectSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_by")
    .order("created_at", { ascending: true });

  if (error) throw new Error("Projeler yüklenemedi.");
  return data;
});
