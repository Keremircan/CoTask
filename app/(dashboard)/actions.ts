"use server";

import { refresh } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isTaskStatus, isUuid } from "@/lib/tasks";

export type CreateTaskState = {
  status: "idle" | "success" | "error";
  message: string | null;
  // Her başarılı kayıtta değişir; formu sıfırlamak için kullanılır
  submissionId: number;
};

export async function createTask(
  prev: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const user = await getCurrentUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedTo = formData.get("assigned_to");

  if (!title) {
    return { ...prev, status: "error", message: "İş başlığı zorunludur." };
  }
  if (title.length > 200) {
    return {
      ...prev,
      status: "error",
      message: "İş başlığı en fazla 200 karakter olabilir.",
    };
  }
  if (!isUuid(assignedTo)) {
    return { ...prev, status: "error", message: "Sorumlu kişiyi seçin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    description: description || null,
    assigned_to: assignedTo,
    created_by: user.id,
  });

  if (error) {
    return {
      ...prev,
      status: "error",
      message:
        error.code === "23503"
          ? "Seçilen ekip üyesi bulunamadı."
          : "İş kaydedilemedi. Lütfen tekrar deneyin.",
    };
  }

  refresh();
  return {
    status: "success",
    message: "İş atandı.",
    submissionId: prev.submissionId + 1,
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<{ error: string | null }> {
  await getCurrentUser();

  if (!isUuid(taskId) || !isTaskStatus(status)) {
    return { error: "Geçersiz istek." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) return { error: "Durum güncellenemedi." };

  refresh();
  return { error: null };
}
