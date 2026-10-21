// Görev açıklaması ve yorumlardaki linkleri toplar

export type LinkKind = "github" | "figma" | "docs" | "web";

export type ExtractedLink = {
  url: string;
  host: string;
  label: string;
  kind: LinkKind;
  source: string; // "Açıklama" ya da "Yorum · Ayşe"
};

// http(s) ile başlayan, boşluk/tırnak/açılı parantez içermeyen adresler
const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;
// Cümle sonundaki noktalama ve Markdown kapanışları linke dahil değildir
const TRAILING_RE = /[)\].,;:!?*_]+$/;

export function extractLinks(
  sources: { text: string | null; source: string }[],
): ExtractedLink[] {
  const seen = new Map<string, ExtractedLink>();

  for (const { text, source } of sources) {
    if (!text) continue;
    for (const match of text.matchAll(URL_RE)) {
      const raw = match[0].replace(TRAILING_RE, "");
      let url: URL;
      try {
        url = new URL(raw);
      } catch {
        continue;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;

      const href = url.toString();
      if (seen.has(href)) continue;
      seen.set(href, { url: href, source, ...describe(url) });
    }
  }

  return [...seen.values()];
}

function describe(url: URL): Pick<ExtractedLink, "host" | "label" | "kind"> {
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "github.com") {
    const [owner, repo, type, num] = parts;
    if (repo && (type === "pull" || type === "issues") && num) {
      const what = type === "pull" ? "PR" : "Issue";
      return { host, kind: "github", label: `${owner}/${repo} · ${what} #${num}` };
    }
    return { host, kind: "github", label: parts.slice(0, 2).join("/") || host };
  }

  if (host.endsWith("figma.com")) {
    const name = decodeSafe(parts[2] ?? "").replace(/-/g, " ");
    return { host, kind: "figma", label: name || "Figma dosyası" };
  }

  const isDocs =
    host.startsWith("docs.") ||
    host.includes("notion.") ||
    host === "developer.mozilla.org" ||
    parts[0] === "docs";

  const path = decodeSafe(url.pathname).replace(/\/$/, "");
  return {
    host,
    kind: isDocs ? "docs" : "web",
    label: path && path !== "/" ? `${host}${truncate(path, 48)}` : host,
  };
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
