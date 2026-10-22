import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@/lib/tasks";
import { GENERAL_BUCKET } from "@/lib/general-files";

// "Genel" sayfasındaki bir dokümanı açar / indirir.
// Süreli imzalı link sayfa çizilirken değil, sadece gerektiğinde üretilir:
// böylece sayfa, doküman sayısından bağımsız olarak hızlı açılır.
// Erişim: giriş yapmamış istekler proxy.ts tarafından /login'e yönlendirilir;
// dosya kaydını okumak da RLS ile sadece giriş yapmış ekibe açıktır.

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(request: NextRequest, ctx: RouteContext<"/api/genel/dosya/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new NextResponse("Geçersiz dosya.", { status: 400 });

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("general_files")
    .select("file_url, file_name")
    .eq("id", id)
    .maybeSingle();

  if (!file) return new NextResponse("Dosya bulunamadı.", { status: 404 });

  const download = request.nextUrl.searchParams.has("indir");
  const { data, error } = await supabase.storage
    .from(GENERAL_BUCKET)
    .createSignedUrl(
      file.file_url,
      SIGNED_URL_TTL_SECONDS,
      download ? { download: file.file_name } : undefined,
    );

  if (error || !data?.signedUrl) {
    return new NextResponse("Dosya bağlantısı oluşturulamadı.", { status: 502 });
  }

  const response = NextResponse.redirect(data.signedUrl, 302);
  // Tarayıcı aynı dosyayı kısa süre tekrar sormasın (link 1 saat geçerli)
  response.headers.set("Cache-Control", "private, max-age=600");
  return response;
}
