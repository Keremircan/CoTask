"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { extractLinks, GENERAL_LINK_SCOPE } from "@/lib/links";
import { isUuid } from "@/lib/tasks";

export type LinkResult = { error: string | null };

// Linki LİNKLER listesinden kaldırır (mesaj/yorum metnine dokunmaz).
// Yetki: linki paylaşan kişi ya da Admin. Paylaşanlar, metinlerden sunucuda
// yeniden çıkarılır; tarayıcının gönderdiği bilgiye güvenilmez.
export async function removeLink(scope: string, url: string): Promise<LinkResult> {
  const user = await getCurrentUser();
  if (scope !== GENERAL_LINK_SCOPE && !isUuid(scope)) return { error: "Geçersiz istek." };
  if (typeof url !== "string" || url.length > 2048 || !/^https?:\/\//i.test(url)) {
    return { error: "Geçersiz link." };
  }

  const supabase = await createClient();

  if (!user.isAdmin) {
    const sources =
      scope === GENERAL_LINK_SCOPE
        ? ((await supabase.from("general_messages").select("content, user_id").limit(5000)).data ?? []).map(
            (m) => ({ text: m.content, source: "", authorId: m.user_id }),
          )
        : await taskSources(supabase, scope);

    const link = extractLinks(sources).find((l) => l.url === url);
    if (!link) return { error: "Link bulunamadı." };
    if (!link.authorIds.includes(user.id)) {
      return { error: "Linki sadece paylaşan kişi veya Admin kaldırabilir." };
    }
  }

  const { error } = await supabase
    .from("removed_links")
    .upsert({ scope, url, removed_by: user.id }, { onConflict: "scope,url", ignoreDuplicates: true });

  if (error) return { error: "Link kaldırılamadı." };

  revalidatePath(scope === GENERAL_LINK_SCOPE ? "/genel" : "/gorevler/[id]", "page");
  return { error: null };
}

async function taskSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
) {
  const [{ data: task }, { data: comments }] = await Promise.all([
    supabase.from("tasks").select("description, created_by").eq("id", taskId).maybeSingle(),
    supabase.from("task_comments").select("content, user_id").eq("task_id", taskId),
  ]);
  return [
    { text: task?.description ?? null, source: "", authorId: task?.created_by ?? null },
    ...(comments ?? []).map((c) => ({ text: c.content, source: "", authorId: c.user_id })),
  ];
}
