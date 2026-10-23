import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service role ile çalışan yönetici istemcisi: RLS'i atlar, hesap oluşturur/siler.
// SADECE sunucuda kullanılır ("server-only" tarayıcı paketine girmesini engeller).
// Anahtar NEXT_PUBLIC_ ile başlamaz; bu yüzden tarayıcıya asla gönderilmez.
// Anahtar tanımlı değilse null döner (üye ekleme/çıkarma kapalı kalır).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
