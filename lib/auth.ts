import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
};

// Aynı istek içinde layout ve sayfa birlikte çağırsa da tek sorgu atılır.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  // getClaims oturum token'ını doğrular (proxy.ts'e ek güvenlik katmanı)
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const email = typeof claims.email === "string" ? claims.email : "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email,
    name: profile?.full_name || email.split("@")[0] || "Ekip üyesi",
  };
});
