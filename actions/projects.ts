"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { isUuid } from "@/lib/tasks";

export type ProjectResult = { error: string | null; projectId?: string };

function readName(raw: unknown): string | { error: string } {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { error: "Proje adı zorunludur." };
  if (name.length > 80) return { error: "Proje adı en fazla 80 karakter olabilir." };
  return name;
}

function projectError(error: PostgrestError, fallback: string) {
  if (error.code === "23505") return "Bu adda bir proje zaten var.";
  if (error.code === "23503") return "İçinde görev olan proje silinemez.";
  return fallback;
}

export async function createProject(name: string): Promise<ProjectResult> {
  const userId = await getUserId();
  const parsed = readName(name);
  if (typeof parsed !== "string") return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: parsed, created_by: userId })
    .select("id")
    .single();

  if (error) return { error: projectError(error, "Proje oluşturulamadı.") };

  revalidatePath("/", "layout");
  return { error: null, projectId: data.id };
}

export async function renameProject(
  projectId: string,
  name: string,
): Promise<ProjectResult> {
  await getUserId();
  if (!isUuid(projectId)) return { error: "Geçersiz proje." };
  const parsed = readName(name);
  if (typeof parsed !== "string") return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: parsed })
    .eq("id", projectId)
    .select("id");

  if (error) return { error: projectError(error, "Proje adı değiştirilemedi.") };
  if (!data.length) {
    return { error: "Projeyi sadece oluşturan kişi veya Admin düzenleyebilir." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

export async function deleteProject(projectId: string): Promise<ProjectResult> {
  await getUserId();
  if (!isUuid(projectId)) return { error: "Geçersiz proje." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .select("id");

  if (error) return { error: projectError(error, "Proje silinemedi.") };
  if (!data.length) {
    return { error: "Projeyi sadece oluşturan kişi veya Admin silebilir." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
