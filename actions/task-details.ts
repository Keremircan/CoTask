"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/tasks";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ATTACHMENTS_BUCKET,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";

export type ActionResult = { error: string | null };

const MAX_COMMENT_LENGTH = 20_000;

function revalidateTaskPages() {
  revalidatePath("/gorevler/[id]", "page");
  revalidatePath("/", "layout");
}

export async function addComment(
  taskId: string,
  content: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  const text = String(content ?? "").trim();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };
  if (!text) return { error: "Yorum boş olamaz." };
  if (text.length > MAX_COMMENT_LENGTH) {
    return { error: "Yorum çok uzun (en fazla 20.000 karakter)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: user.id, content: text });

  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Görev bulunamadı."
          : "Yorum kaydedilemedi. Lütfen tekrar deneyin.",
    };
  }

  revalidateTaskPages();
  return { error: null };
}

export async function uploadAttachment(
  taskId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!isUuid(taskId)) return { error: "Geçersiz görev." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Yüklenecek bir dosya seçin." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "Dosya en fazla 10 MB olabilir." };
  }
  const ext = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!ext) {
    return { error: "Sadece görsel (PNG, JPG, GIF, WEBP) ve PDF yüklenebilir." };
  }

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return { error: "Görev bulunamadı." };

  // Depoda güvenli, benzersiz bir ad; asıl dosya adı tabloda saklanır
  const path = `${taskId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return {
      error: /bucket not found/i.test(uploadError.message)
        ? "Storage bucket'ı bulunamadı (supabase/storage.sql çalıştırılmalı)."
        : "Dosya yüklenemedi. Lütfen tekrar deneyin.",
    };
  }

  const fileName = file.name.trim().slice(0, 255) || `dosya.${ext}`;
  const { error: insertError } = await supabase.from("task_attachments").insert({
    task_id: taskId,
    file_url: path, // özel bucket: görüntülerken süreli imzalı link üretilir
    file_name: fileName,
    file_type: file.type,
    uploaded_by: user.id,
  });

  if (insertError) {
    // Kaydı tutulamayan dosyayı depoda sahipsiz bırakma
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
    return { error: "Dosya kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidateTaskPages();
  return { error: null };
}
