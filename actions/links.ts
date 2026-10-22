"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { extractLinks, GENERAL_LINK_SCOPE } from "@/lib/links";
import { isUuid } from "@/lib/tasks";

export type LinkResult = { error: string | null };

// Linki LİNKLER listesinden kaldırır (mesaj/yorum metnine dokunmaz).
// Kaldırma, linkin o ana kadarki EN SON paylaşımına kadar olan her şeyi kapsar;
// sonradan yeniden paylaşılırsa listede tekrar görünür.
// Not: Kaldırma zamanı saatten değil, son paylaşımın veritabanı zamanından
// türetilir. Böylece sunucu ile veritabanı saati arasındaki küçük farklar
// "yeniden paylaş → hemen kaldır" gibi hızlı durumlarda yanlış sonuç vermez.
// Yetki: linki paylaşan kişi ya da Admin. Paylaşanlar, metinlerden sunucuda
// yeniden çıkarılır; tarayıcının gönderdiği bilgiye güvenilmez.
export async function removeLink(scope: string, url: string): Promise<LinkResult> {
  const user = await getCurrentUser();
  if (scope !== GENERAL_LINK_SCOPE && !isUuid(scope)) return { error: "Geçersiz istek." };
  if (typeof url !== "string" || url.length > 2048 || !/^https?:\/\//i.test(url)) {
    return { error: "Geçersiz link." };
  }

  const supabase = await createClient();

  const sources =
    scope === GENERAL_LINK_SCOPE ? await generalSources(supabase) : await taskSources(supabase, scope);

  const link = extractLinks(sources).find((l) => l.url === url);
  if (!link) return { error: "Link bulunamadı." };
  if (!user.isAdmin && !link.authorIds.includes(user.id)) {
    return { error: "Linki sadece paylaşan kişi veya Admin kaldırabilir." };
  }

  // Son paylaşımdan 1 ms sonrası: o ana kadarki tüm paylaşımlar gizlenir
  const coveredUntil = new Date(
    (link.lastSharedAt ? new Date(link.lastSharedAt).getTime() : Date.now()) + 1,
  ).toISOString();

  const { error } = await supabase
    .from("removed_links")
    .upsert(
      { scope, url, removed_by: user.id, created_at: coveredUntil },
      { onConflict: "scope,url" },
    );

  if (error) return { error: "Link kaldırılamadı." };

  revalidatePath(scope === GENERAL_LINK_SCOPE ? "/genel" : "/gorevler/[id]", "page");
  return { error: null };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function generalSources(supabase: Supabase) {
  const { data } = await supabase
    .from("general_messages")
    .select("content, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  return (data ?? []).map((m) => ({
    text: m.content,
    source: "",
    authorId: m.user_id,
    at: m.created_at,
  }));
}

async function taskSources(supabase: Supabase, taskId: string) {
  const [{ data: task }, { data: comments }] = await Promise.all([
    supabase.from("tasks").select("description, created_by, created_at").eq("id", taskId).maybeSingle(),
    supabase.from("task_comments").select("content, user_id, created_at").eq("task_id", taskId),
  ]);
  return [
    {
      text: task?.description ?? null,
      source: "",
      authorId: task?.created_by ?? null,
      at: task?.created_at ?? null,
    },
    ...(comments ?? []).map((c) => ({
      text: c.content,
      source: "",
      authorId: c.user_id,
      at: c.created_at,
    })),
  ];
}
