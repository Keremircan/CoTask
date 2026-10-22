// "Genel" sayfasında paylaşılabilen dokümanlar (hem sunucu hem tarayıcı kullanır).
// Tür, tarayıcının bildirdiği MIME'a değil dosya uzantısına göre belirlenir:
// Windows bazı türleri (ör. CSV, ZIP) farklı bildirebiliyor.

export const GENERAL_BUCKET = "general-files";
export const MAX_GENERAL_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type FileKind = "image" | "pdf" | "word" | "excel" | "powerpoint" | "text" | "archive";

const TYPES: Record<string, { mime: string; kind: FileKind }> = {
  png: { mime: "image/png", kind: "image" },
  jpg: { mime: "image/jpeg", kind: "image" },
  jpeg: { mime: "image/jpeg", kind: "image" },
  gif: { mime: "image/gif", kind: "image" },
  webp: { mime: "image/webp", kind: "image" },
  pdf: { mime: "application/pdf", kind: "pdf" },
  doc: { mime: "application/msword", kind: "word" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "word" },
  xls: { mime: "application/vnd.ms-excel", kind: "excel" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "excel" },
  csv: { mime: "text/csv", kind: "excel" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "powerpoint" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "powerpoint" },
  txt: { mime: "text/plain", kind: "text" },
  zip: { mime: "application/zip", kind: "archive" },
};

export const GENERAL_ACCEPT = Object.keys(TYPES).map((ext) => `.${ext}`).join(",");
export const GENERAL_TYPES_LABEL = "Görsel, PDF, Word, Excel, PowerPoint, TXT/CSV, ZIP";

export function extensionOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

// Desteklenmeyen uzantıda null döner
export function generalFileType(name: string) {
  const ext = extensionOf(name);
  const type = TYPES[ext];
  return type ? { ext, ...type } : null;
}

export function kindOfMime(mime: string | null): FileKind {
  const found = Object.values(TYPES).find((t) => t.mime === mime);
  return found?.kind ?? "text";
}
