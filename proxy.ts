// Next.js 16'da middleware.ts'in yeni adı proxy.ts'tir (işlev aynı).
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Statik dosyalar, görseller ve PWA dosyaları (manifest, service worker,
    // çevrimdışı sayfası) hariç tüm yollar: bunlar girişsiz de erişilebilmeli
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
