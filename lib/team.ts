import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export type TeamMember = { id: string; name: string };

// Açılır kutular için ekip üyeleri (profiles tablosu)
export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  if (error) throw new Error("Ekip üyeleri yüklenemedi.");

  return data.map((p) => ({ id: p.id, name: p.full_name || "İsimsiz üye" }));
});
