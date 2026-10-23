"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { isUuid } from "@/lib/tasks";
import { cleanCategory, cleanTitle, MAX_TODO_TITLE } from "@/lib/personal-todo";

// Kişisel yapılacaklar listesi. Gizlilik veritabanında (RLS: user_id = auth.uid())
// garanti altında; buradaki user_id filtreleri ek bir güvenlik katmanıdır.

export type TodoResult = { error: string | null };

function readTitle(raw: unknown): string | { error: string } {
  const title = cleanTitle(raw);
  if (!title) return { error: "Madde boş olamaz." };
  if (title.length > MAX_TODO_TITLE) return { error: "Madde en fazla 1000 karakter olabilir." };
  return title;
}

function done() {
  revalidatePath("/todo");
  return { error: null };
}

// id tarayıcıda üretilir; ekranda anında beliren madde kayıttan sonra da aynı kalır
export async function createPersonalTodo(
  id: string,
  title: string,
  category: string | null,
): Promise<TodoResult> {
  const userId = await getUserId();
  if (!isUuid(id)) return { error: "Geçersiz madde." };
  const parsed = readTitle(title);
  if (typeof parsed !== "string") return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("personal_todos").insert({
    id,
    user_id: userId,
    title: parsed,
    category: cleanCategory(category),
  });
  if (error) return { error: "Madde eklenemedi." };
  return done();
}

export async function togglePersonalTodo(id: string, isCompleted: boolean): Promise<TodoResult> {
  const userId = await getUserId();
  if (!isUuid(id)) return { error: "Geçersiz madde." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("personal_todos")
    .update({ is_completed: Boolean(isCompleted) })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Madde güncellenemedi." };
  return done();
}

export async function updatePersonalTodo(id: string, title: string): Promise<TodoResult> {
  const userId = await getUserId();
  if (!isUuid(id)) return { error: "Geçersiz madde." };
  const parsed = readTitle(title);
  if (typeof parsed !== "string") return parsed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("personal_todos")
    .update({ title: parsed })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Madde düzenlenemedi." };
  return done();
}

export async function deletePersonalTodo(id: string): Promise<TodoResult> {
  const userId = await getUserId();
  if (!isUuid(id)) return { error: "Geçersiz madde." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("personal_todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Madde silinemedi." };
  return done();
}

// Başlığı yeniden adlandırır (o başlıktaki tüm maddeler taşınır).
// from: null = başlıksız maddeler
export async function renamePersonalCategory(
  from: string | null,
  to: string,
): Promise<TodoResult> {
  const userId = await getUserId();
  const target = cleanCategory(to);
  if (!target) return { error: "Başlık boş olamaz." };

  const supabase = await createClient();
  const query = supabase.from("personal_todos").update({ category: target }).eq("user_id", userId);
  const { error } = await (from === null ? query.is("category", null) : query.eq("category", from));
  if (error) return { error: "Başlık değiştirilemedi." };
  return done();
}

// Başlığı içindeki tüm maddelerle birlikte siler
export async function deletePersonalCategory(category: string | null): Promise<TodoResult> {
  const userId = await getUserId();

  const supabase = await createClient();
  const query = supabase.from("personal_todos").delete().eq("user_id", userId);
  const { error } = await (category === null
    ? query.is("category", null)
    : query.eq("category", category));
  if (error) return { error: "Başlık silinemedi." };
  return done();
}
