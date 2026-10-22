import { dayKey } from "@/lib/format";

// Gün seçicinin adres çubuğundaki değeri (?gun=...)
//   yok          → bugün (varsayılan)
//   YYYY-MM-DD   → o gün
//   "tumu"       → tüm günler
export const ALL_DAYS = "tumu";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayKey() {
  return dayKey(new Date().toISOString());
}

// Seçilen gün; tüm günler seçiliyse null
export function parseDayParam(gun: string | string[] | undefined, today: string): string | null {
  if (gun === ALL_DAYS) return null;
  if (typeof gun === "string" && DAY_RE.test(gun)) return gun;
  return today;
}
