"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { EVERYONE, isTaskPriority, isUuid } from "@/lib/tasks";
import type { TaskPriority } from "@/types/database";
import { ATTACHMENTS_BUCKET } from "@/lib/attachments";

export type ActionResult = { error: string | null };
export type CreateTaskResult = ActionResult & { taskId: string | null };

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 50_000;

function revalidateAll() {
  // Küçük uygulama: sidebar, panolar ve listeler birlikte yenilenir
  revalidatePath("/", "layout");
}

// Veritabanı kurallarından (trigger) gelen Türkçe mesajı kullanıcıya göster
function dbError(error: PostgrestError, fallback: string) {
  if (error.code === "42501" && error.message) return error.message;
  if (error.code === "23503") return "Seçilen proje veya kişi bulunamadı.";
  return fallback;
}

type TaskFields = {
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  priority: TaskPriority;
};

function readTaskForm(formData: FormData): TaskFields | string {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectId = formData.get("project_id");
  const assignee = formData.get("assigned_to");
  const priority = formData.get("priority") ?? "none";

  if (!title) return "Görev adı zorunludur.";
  if (title.length > MAX_TITLE) return "Görev adı en fazla 200 karakter olabilir.";
  if (description.length > MAX_DESCRIPTION) return "Görev açıklaması çok uzun.";
  if (!isUuid(projectId)) return "Görevin bağlı olduğu projeyi seçin.";
  if (assignee !== EVERYONE && !isUuid(assignee)) {
    return "Görevi atayacağınız kişiyi seçin.";
  }
  if (!isTaskPriority(priority)) return "Geçersiz öncelik.";

  return {
    title,
    description: description || null,
    project_id: projectId,
    assigned_to: assignee === EVERYONE ? null : (assignee as string),
    priority,
  };
}

export async function createTask(formData: FormData): Promise<CreateTaskResult> {
  const userId = await getUserId();
  const fields = readTaskForm(formData);
  if (typeof fields === "string") return { error: fields, taskId: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...fields, created_by: userId, status: "pending" })
    .select("id")
    .single();

  if (error) {
    return { error: dbError(error, "Görev kaydedilemedi."), taskId: null };
  }

  revalidateAll();
  return { error: null, taskId: data.id };
}

export async function updateTask(
  taskId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const fields = readTaskForm(formData);
  if (typeof fields === "string") return { error: fields };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(fields)
    .eq("id", taskId)
    .eq("created_by", userId)
    .select("id");

  if (error) return { error: dbError(error, "Görev güncellenemedi.") };
  if (!data.length) return { error: "Görevi sadece atayan kişi düzenleyebilir." };

  revalidateAll();
  return { error: null };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const supabase = await createClient();

  // Görev silinince ek kayıtları da silinir; depodaki dosyaları da temizle
  const { data: files } = await supabase
    .from("task_attachments")
    .select("file_url")
    .eq("task_id", taskId);

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("created_by", userId)
    .select("id");

  if (error) return { error: dbError(error, "Görev silinemedi.") };
  if (!data.length) return { error: "Görevi sadece atayan kişi silebilir." };

  if (files?.length) {
    await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove(files.map((f) => f.file_url));
  }

  revalidateAll();
  return { error: null };
}

// Kabul Et: atanan kişi (ya da "Herkes" görevinde ilk kabul eden) görevi alır
export async function acceptTask(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ assigned_to: userId, status: "in_progress" })
    .eq("id", taskId)
    .eq("status", "pending")
    .or(`assigned_to.is.null,assigned_to.eq.${userId}`)
    .select("id");

  if (error) return { error: dbError(error, "Görev kabul edilemedi.") };
  if (!data.length) {
    return { error: "Bu görev artık kabul edilemiyor (başka biri almış olabilir)." };
  }

  revalidateAll();
  return { error: null };
}

// Kontrole gönder: sadece görevi alan kişi
export async function submitForReview(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "review" })
    .eq("id", taskId)
    .eq("status", "in_progress")
    .eq("assigned_to", userId)
    .select("id");

  if (error) return { error: dbError(error, "Görev kontrole gönderilemedi.") };
  if (!data.length) return { error: "Görevi sadece sorumlusu kontrole gönderebilir." };

  revalidateAll();
  return { error: null };
}

// Tamamlandı: sadece görevi atayan kişi, görev kabul edildikten sonra
export async function completeTask(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "done" })
    .eq("id", taskId)
    .eq("created_by", userId)
    .in("status", ["in_progress", "review"])
    .select("id");

  if (error) return { error: dbError(error, "Görev tamamlanamadı.") };
  if (!data.length) {
    return { error: "Görev ancak kabul edildikten sonra atayan kişi tarafından tamamlanabilir." };
  }

  revalidateAll();
  return { error: null };
}
