import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  avatarUrl: string | null;
};

type Claims = { id: string; email: string };

// Oturumdaki kullanıcının kimliği. getClaims JWT'yi yerelde doğrular
// (imza anahtarı önbellekte), yani Supabase'e istek atmaz: neredeyse 0 ms.
// Sadece kimlik gereken yerlerde bunu kullanın ki sorgular beklemeden başlasın.
const getClaims = cache(async (): Promise<Claims> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  };
});

export async function getUserId(): Promise<string> {
  return (await getClaims()).id;
}

// Ad ve Admin bilgisi de gerekiyorsa (1 tur Supabase isteği).
// Aynı istek içinde birden çok bileşen çağırsa da tek sorgu atılır.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const { id, email } = await getClaims();
  const supabase = await createClient();

  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", id).maybeSingle(),
    supabase.rpc("is_admin"),
  ]);

  return {
    id,
    email,
    name: profile?.full_name || email.split("@")[0] || "Ekip üyesi",
    isAdmin: isAdmin === true,
    avatarUrl: profile?.avatar_url ?? null,
  };
});
