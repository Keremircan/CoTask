import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export const MEMBER_PERMISSION_KEY = "member_management_permission";

export type MemberPermission = {
  isAdmin: boolean;
  allowAll: boolean; // Admin dışındaki üyeler de ekleyip çıkarabilir mi?
  canManage: boolean; // bu kullanıcı üye ekleyip çıkarabilir mi?
};

// Oturumdaki kullanıcının üye ekleme/çıkarma yetkisi.
// Ayar okunamazsa (tablo yok vb.) güvenli varsayılan: sadece Admin.
export const getMemberPermission = cache(async (): Promise<MemberPermission> => {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getCurrentUser(),
    supabase.from("app_settings").select("value").eq("key", MEMBER_PERMISSION_KEY).maybeSingle(),
  ]);
  const allowAll = data?.value?.allow_all_members === true;
  return { isAdmin: user.isAdmin, allowAll, canManage: user.isAdmin || allowAll };
});
