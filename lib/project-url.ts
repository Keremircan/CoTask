// Proje linki: boş = link yok. "ornek.com" gibi şemasız girişe https:// eklenir;
// sadece http(s) adresleri kabul edilir (javascript: vb. engellenir).
export const MAX_PROJECT_URL = 2048;

export function parseProjectUrl(raw: unknown): { url: string | null } | { error: string } {
  const text = String(raw ?? "").trim();
  if (!text) return { url: null };
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "Link http:// veya https:// ile başlamalı." };
    }
    if (!url.hostname.includes(".") && url.hostname !== "localhost") {
      return { error: "Geçerli bir link girin (ör. https://ornek.com)." };
    }
    const href = url.href;
    if (href.length > MAX_PROJECT_URL) return { error: "Link çok uzun." };
    return { url: href };
  } catch {
    return { error: "Geçerli bir link girin (ör. https://ornek.com)." };
  }
}

// Ekranda gösterilecek kısa hali: "github.com/ekip/proje"
export function displayUrl(href: string) {
  try {
    const url = new URL(href);
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return href;
  }
}
