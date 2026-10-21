"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/tasks";

export type RoleResult = { error: string | null };

const ADMIN_ONLY = "Rolleri sadece Admin yönetebilir.";

export async function createRole(name: string): Promise<RoleResult> {
  const user = await getCurrentUser();
  if (!user.isAdmin) return { error: ADMIN_ONLY };

  const clean = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return { error: "Rol adı zorunludur." };
  if (clean.length > 40) return { error: "Rol adı en fazla 40 karakter olabilir." };
  if (clean.toLocaleLowerCase("tr-TR") === "admin") {
    return { error: "Admin rolü sabittir, yenisi oluşturulamaz." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("roles")
    .insert({ name: clean, created_by: user.id, is_system: false });

  if (error) {
    return {
      error: error.code === "23505" ? "Bu adda bir rol zaten var." : "Rol oluşturulamadı.",
    };
  }

  revalidatePath("/uyeler");
  return { error: null };
}

export async function deleteRole(roleId: string): Promise<RoleResult> {
  const user = await getCurrentUser();
  if (!user.isAdmin) return { error: ADMIN_ONLY };
  if (!isUuid(roleId)) return { error: "Geçersiz rol." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .delete()
    .eq("id", roleId)
    .eq("is_system", false)
    .select("id");

  if (error) return { error: "Rol silinemedi." };
  if (!data.length) return { error: "Admin rolü silinemez." };

  revalidatePath("/uyeler");
  return { error: null };
}

// Üyeye rol ver ya da rolü geri al (bir kişi birden fazla rol alabilir)
export async function setMemberRole(
  profileId: string,
  roleId: string,
  assigned: boolean,
): Promise<RoleResult> {
  const user = await getCurrentUser();
  if (!user.isAdmin) return { error: ADMIN_ONLY };
  if (!isUuid(profileId) || !isUuid(roleId)) return { error: "Geçersiz istek." };

  const supabase = await createClient();

  const { data: role } = await supabase
    .from("roles")
    .select("is_system")
    .eq("id", roleId)
    .maybeSingle();
  if (!role) return { error: "Rol bulunamadı." };
  if (role.is_system) return { error: "Admin rolü değiştirilemez." };

  const { error } = assigned
    ? await supabase
        .from("member_roles")
        .upsert(
          { profile_id: profileId, role_id: roleId },
          { onConflict: "profile_id,role_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("member_roles")
        .delete()
        .eq("profile_id", profileId)
        .eq("role_id", roleId);

  if (error) return { error: "Rol ataması güncellenemedi." };

  revalidatePath("/uyeler");
  return { error: null };
}
