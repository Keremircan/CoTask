// Kişisel yapılacaklar: sunucu ve tarayıcı tarafında ortak kurallar

export const MAX_TODO_TITLE = 1000;
export const MAX_TODO_CATEGORY = 80;

// Boşlukları sadeleştirir; boş başlık = başlıksız (null)
export function cleanCategory(raw: unknown): string | null {
  const text = String(raw ?? "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, MAX_TODO_CATEGORY) : null;
}

export function cleanTitle(raw: unknown): string {
  return String(raw ?? "").trim();
}
